package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Pet;
import com.petcare.backend.entity.SurgicalProcedure;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.PetRepository;
import com.petcare.backend.repository.SurgicalProcedureRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.SurgicalProcedureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SurgicalProcedureServiceImpl implements SurgicalProcedureService {

    private final SurgicalProcedureRepository surgicalRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    @Override
    public List<SurgicalProcedure> getSurgeriesForUser(String userEmail) {
        User user = findUser(userEmail);

        if (user.getRole() == User.Role.ADMIN) {
            // Admins see all surgeries
            return surgicalRepository.findAll();
        }
        if (user.getRole() == User.Role.VET) {
            // Vets see their own surgical calendar
            return surgicalRepository.findByVetId(user.getId());
        }
        // Pet owners see surgeries for their pets
        return surgicalRepository.findByOwnerId(user.getId());
    }

    @Override
    public List<User> listVets() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.VET)
                .toList();
    }

    @Override
    public SurgicalProcedure scheduleSurgery(String ownerEmail, Long petId, Long vetId,
                                              String procedureName, LocalDateTime surgeryDateTime,
                                              String preOpInstructions) {
        User owner = findUser(ownerEmail);
        Pet pet = findPet(petId);
        User vet = findVet(vetId);

        if (!pet.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only schedule surgeries for your own pets.");
        }

        if (procedureName == null || procedureName.isBlank()) {
            throw new IllegalArgumentException("Procedure name is required.");
        }

        if (surgeryDateTime == null || surgeryDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Please select a future date and time for the surgery.");
        }

        SurgicalProcedure surgery = SurgicalProcedure.builder()
                .procedureName(procedureName.trim())
                .preOpInstructions(preOpInstructions)
                .surgeryDateTime(surgeryDateTime)
                .postOpNotes(null)
                .status(SurgicalProcedure.SurgicalStatus.SCHEDULED)
                .pet(pet)
                .owner(owner)
                .vet(vet)
                .build();

        return surgicalRepository.save(surgery);
    }

    @Override
    public SurgicalProcedure updateStatus(Long surgeryId, String callerEmail, String newStatus) {
        User caller = findUser(callerEmail);
        SurgicalProcedure surgery = findSurgery(surgeryId);

        boolean isOwner = surgery.getOwner().getId().equals(caller.getId());
        boolean isAssignedVet = surgery.getVet() != null && surgery.getVet().getId().equals(caller.getId());
        boolean isAdmin = caller.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAssignedVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorised to update this surgical procedure.");
        }

        SurgicalProcedure.SurgicalStatus status;
        try {
            status = SurgicalProcedure.SurgicalStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status. Allowed: SCHEDULED, PRE_OP, COMPLETED, CANCELLED.");
        }

        // Only VETs and ADMINs can mark PRE_OP or COMPLETED
        if ((status == SurgicalProcedure.SurgicalStatus.PRE_OP || status == SurgicalProcedure.SurgicalStatus.COMPLETED)
                && !isAssignedVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the assigned veterinarian can mark a surgery as Pre-Op or Completed.");
        }

        surgery.setStatus(status);
        return surgicalRepository.save(surgery);
    }

    @Override
    public SurgicalProcedure addPostOpNotes(Long surgeryId, String vetEmail, String postOpNotes) {
        User vet = findUser(vetEmail);
        SurgicalProcedure surgery = findSurgery(surgeryId);

        boolean isAssignedVet = surgery.getVet() != null && surgery.getVet().getId().equals(vet.getId());

        if (!isAssignedVet && vet.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the assigned vet can add post-op notes.");
        }

        surgery.setPostOpNotes(postOpNotes);
        surgery.setStatus(SurgicalProcedure.SurgicalStatus.COMPLETED);
        return surgicalRepository.save(surgery);
    }

    @Override
    public SurgicalProcedure cancelSurgery(Long surgeryId, String callerEmail) {
        User caller = findUser(callerEmail);
        SurgicalProcedure surgery = findSurgery(surgeryId);

        boolean isOwner = surgery.getOwner().getId().equals(caller.getId());
        boolean isVet = surgery.getVet() != null && surgery.getVet().getId().equals(caller.getId());

        if (!isOwner && !isVet && caller.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorised to cancel this surgical procedure.");
        }

        surgery.setStatus(SurgicalProcedure.SurgicalStatus.CANCELLED);
        return surgicalRepository.save(surgery);
    }


    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private Pet findPet(Long id) {
        return petRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found."));
    }

    private User findVet(Long id) {
        User vet = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vet not found."));
        if (vet.getRole() != User.Role.VET) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected person is not a veterinarian.");
        }
        return vet;
    }

    @Override
    public SurgicalProcedure getSurgeryById(Long surgeryId, String userEmail) {
        User user = findUser(userEmail);
        SurgicalProcedure surgery = findSurgery(surgeryId);

        boolean isOwner = surgery.getOwner().getId().equals(user.getId());
        boolean isVet = surgery.getVet() != null && surgery.getVet().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isVet && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        return surgery;
    }

    @Override
    public void deleteSurgery(Long surgeryId, String userEmail) {
        User user = findUser(userEmail);
        SurgicalProcedure surgery = findSurgery(surgeryId);

        boolean isOwner = surgery.getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own surgical procedures.");
        }
        surgicalRepository.delete(surgery);
    }

    private SurgicalProcedure findSurgery(Long id) {
        return surgicalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Surgical procedure not found."));
    }
}
