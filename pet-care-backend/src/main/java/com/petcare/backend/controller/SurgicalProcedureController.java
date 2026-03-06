package com.petcare.backend.controller;

import com.petcare.backend.entity.SurgicalProcedure;
import com.petcare.backend.entity.User;
import com.petcare.backend.service.SurgicalProcedureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/surgeries")
@RequiredArgsConstructor
public class SurgicalProcedureController {

    private final SurgicalProcedureService surgicalService;

    @GetMapping
    public ResponseEntity<List<SurgicalProcedure>> getMySurgeries(Authentication auth) {
        return ResponseEntity.ok(surgicalService.getSurgeriesForUser(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurgicalProcedure> getSurgeryById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(surgicalService.getSurgeryById(id, auth.getName()));
    }

    @GetMapping("/vets")
    public ResponseEntity<List<User>> listVets() {
        return ResponseEntity.ok(surgicalService.listVets());
    }

    @PostMapping
    public ResponseEntity<SurgicalProcedure> scheduleSurgery(@RequestBody ScheduleRequest req,
                                                              Authentication auth) {
        return ResponseEntity.ok(surgicalService.scheduleSurgery(
                auth.getName(), req.petId(), req.vetId(),
                req.procedureName(), req.surgeryDateTime(), req.preOpInstructions()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SurgicalProcedure> updateStatus(@PathVariable Long id,
                                                           @RequestBody StatusRequest req,
                                                           Authentication auth) {
        return ResponseEntity.ok(surgicalService.updateStatus(id, auth.getName(), req.status()));
    }

    @PutMapping("/{id}/post-op")
    public ResponseEntity<SurgicalProcedure> addPostOpNotes(@PathVariable Long id,
                                                             @RequestBody PostOpRequest req,
                                                             Authentication auth) {
        return ResponseEntity.ok(surgicalService.addPostOpNotes(id, auth.getName(), req.postOpNotes()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<SurgicalProcedure> cancelSurgery(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(surgicalService.cancelSurgery(id, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurgery(@PathVariable Long id, Authentication auth) {
        surgicalService.deleteSurgery(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    public record ScheduleRequest(
            Long petId,
            Long vetId,
            String procedureName,
            LocalDateTime surgeryDateTime,
            String preOpInstructions
    ) {}

    public record StatusRequest(String status) {}

    public record PostOpRequest(String postOpNotes) {}
}
