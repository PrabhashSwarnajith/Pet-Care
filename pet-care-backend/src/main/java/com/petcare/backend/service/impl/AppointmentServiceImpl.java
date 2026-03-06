package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Appointment;
import com.petcare.backend.entity.Pet;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.AppointmentRepository;
import com.petcare.backend.repository.PetRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    @Override
    public List<Appointment> getAppointmentsForUser(String userEmail) {
        User user = findUserByEmail(userEmail);

        if (user.getRole() == User.Role.ADMIN) {
            // Admins see all appointments
            return appointmentRepository.findAll();
        }
        if (user.getRole() == User.Role.VET) {
            // Vets see their own calendar
            return appointmentRepository.findByVetId(user.getId());
        }
        // Pet owners see their bookings
        return appointmentRepository.findByOwnerId(user.getId());
    }

    @Override
    public List<User> listAvailableVets() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.VET)
                .toList();
    }

    @Override
    public Appointment bookAppointment(String ownerEmail, Long petId, Long vetId,
            LocalDateTime time, String reason, String serviceTypeString) {

        User owner = findUserByEmail(ownerEmail);

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found."));

        User vet = userRepository.findById(vetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vet not found."));

        // Can only book with a real vet
        if (vet.getRole() != User.Role.VET) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected person is not a veterinarian.");
        }

        // Can only book for your own pet
        if (!pet.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only book appointments for your own pets.");
        }

        // Appointment must be a future date
        if (time == null || time.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Please select a future date and time for the appointment.");
        }

        // Parse ServiceType safely
        Appointment.ServiceType type = Appointment.ServiceType.VET_VISIT;
        if (serviceTypeString != null && !serviceTypeString.isBlank()) {
            try {
                type = Appointment.ServiceType.valueOf(serviceTypeString.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid service type.");
            }
        }

        Appointment appointment = Appointment.builder()
                .owner(owner)
                .pet(pet)
                .vet(vet)
                .appointmentTime(time)
                .reason(reason)
                .status(Appointment.Status.SCHEDULED)
                .serviceType(type)
                .build();

        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment updateMeetingLink(Long appointmentId, String userEmail, String meetingLink) {
        User user = findUserByEmail(userEmail);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));

        if (!appointment.getVet().getId().equals(user.getId()) && user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the assigned vet can update the meeting link.");
        }

        appointment.setMeetingLink(meetingLink);
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment cancelAppointment(Long appointmentId, String userEmail) {
        User user = findUserByEmail(userEmail);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));

        // Check if the user is allowed to cancel this appointment
        boolean isOwner = appointment.getOwner().getId().equals(user.getId());
        boolean isVet = appointment.getVet().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to cancel this appointment.");
        }

        // Cannot cancel something that already ended
        if (appointment.getStatus() == Appointment.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This appointment has already been completed.");
        }
        if (appointment.getStatus() == Appointment.Status.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This appointment is already cancelled.");
        }

        appointment.setStatus(Appointment.Status.CANCELLED);
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment completeAppointment(Long appointmentId, String userEmail) {
        User user = findUserByEmail(userEmail);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));

        // Only the assigned VET or an ADMIN can complete an appointment
        boolean isVet = appointment.getVet().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the assigned veterinarian can mark an appointment as completed.");
        }

        if (appointment.getStatus() == Appointment.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This appointment is already completed.");
        }
        if (appointment.getStatus() == Appointment.Status.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot complete a cancelled appointment.");
        }

        appointment.setStatus(Appointment.Status.COMPLETED);
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment getAppointmentById(Long appointmentId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));

        boolean isOwner = appointment.getOwner().getId().equals(user.getId());
        boolean isVet = appointment.getVet().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        return appointment;
    }

    @Override
    public void deleteAppointment(Long appointmentId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));

        boolean isOwner = appointment.getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own appointments.");
        }
        appointmentRepository.delete(appointment);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
    }
}
