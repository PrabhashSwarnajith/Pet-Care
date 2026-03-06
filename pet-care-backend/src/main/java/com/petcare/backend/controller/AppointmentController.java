package com.petcare.backend.controller;

import com.petcare.backend.entity.Appointment;
import com.petcare.backend.entity.User;
import com.petcare.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<Appointment>> getMyAppointments(Authentication auth) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForUser(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id, auth.getName()));
    }

    @GetMapping("/vets")
    public ResponseEntity<List<User>> listVets() {
        return ResponseEntity.ok(appointmentService.listAvailableVets());
    }

    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(@RequestBody AppointmentRequest req,
            Authentication auth) {
        return ResponseEntity.ok(appointmentService.bookAppointment(
                auth.getName(), req.petId(), req.vetId(), req.appointmentTime(), req.reason(), req.serviceType()));
    }

    @PutMapping("/{id}/meeting-link")
    public ResponseEntity<Appointment> updateMeetingLink(@PathVariable Long id,
            @RequestBody MeetingLinkRequest req,
            Authentication auth) {
        return ResponseEntity.ok(appointmentService.updateMeetingLink(id, auth.getName(), req.meetingLink()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, auth.getName()));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id, Authentication auth) {
        appointmentService.deleteAppointment(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    public record AppointmentRequest(Long petId, Long vetId, LocalDateTime appointmentTime, String reason,
            String serviceType) {
    }

    public record MeetingLinkRequest(String meetingLink) {
    }
}
