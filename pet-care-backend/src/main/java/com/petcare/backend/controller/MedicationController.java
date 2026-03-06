package com.petcare.backend.controller;

import com.petcare.backend.entity.Medication;
import com.petcare.backend.service.MedicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;

    @GetMapping
    public ResponseEntity<List<Medication>> getMedications(@RequestParam(required = false) Long petId, Authentication auth) {
        if (petId == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(medicationService.getMedicationsForPet(petId, auth.getName()));
    }

    @PostMapping
    public ResponseEntity<Medication> addMedication(@RequestBody MedicationRequest req, Authentication auth) {
        return ResponseEntity.ok(medicationService.addMedication(
                auth.getName(), req.petId(), req.name(), req.dosage(),
                req.frequency(), req.startDate(), req.endDate(), req.notes()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medication> updateMedication(@PathVariable Long id,
                                                       @RequestBody MedicationRequest req,
                                                       Authentication auth) {
        return ResponseEntity.ok(medicationService.updateMedication(
                id, auth.getName(), req.name(), req.dosage(),
                req.frequency(), req.startDate(), req.endDate(), req.notes()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id, Authentication auth) {
        medicationService.deleteMedication(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    public record MedicationRequest(
            Long petId,
            String name,
            String dosage,
            String frequency,
            LocalDate startDate,
            LocalDate endDate,
            String notes
    ) {}
}
