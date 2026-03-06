package com.petcare.backend.service;

import com.petcare.backend.entity.Appointment;
import com.petcare.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentService {
    List<Appointment> getAppointmentsForUser(String userEmail);

    List<User> listAvailableVets();

    Appointment getAppointmentById(Long appointmentId, String userEmail);

    Appointment bookAppointment(String ownerEmail, Long petId, Long vetId, LocalDateTime time, String reason,
            String serviceType);

    Appointment updateMeetingLink(Long appointmentId, String userEmail, String meetingLink);

    Appointment cancelAppointment(Long appointmentId, String userEmail);

    Appointment completeAppointment(Long appointmentId, String userEmail);

    void deleteAppointment(Long appointmentId, String userEmail);
}
