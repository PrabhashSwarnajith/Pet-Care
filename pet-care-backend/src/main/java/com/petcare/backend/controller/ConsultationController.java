package com.petcare.backend.controller;

import com.petcare.backend.entity.Consultation;
import com.petcare.backend.service.ConsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

        private final ConsultationService consultationService;

        @GetMapping
        public ResponseEntity<List<Consultation>> getMyConsultations(Authentication auth) {
                return ResponseEntity.ok(consultationService.getConsultationsForOwner(auth.getName()));
        }

        @GetMapping("/{id}")
        public ResponseEntity<Consultation> getConsultationById(@PathVariable Long id, Authentication auth) {
                return ResponseEntity.ok(consultationService.getConsultationById(id, auth.getName()));
        }

        @PostMapping("/analyze")
        public ResponseEntity<Consultation> analyze(@RequestBody DiagnosisRequest req, Authentication auth) {
                return ResponseEntity.ok(consultationService.analyzeAndSave(
                                auth.getName(), req.petId(), req.base64Image(), req.mimeType(), req.symptoms()));
        }

        @PutMapping("/{id}/vet-review")
        public ResponseEntity<Consultation> vetReview(@PathVariable Long id,
                        @RequestBody VetReviewRequest req,
                        Authentication auth) {
                return ResponseEntity.ok(consultationService.updateVetDiagnosis(
                                id, auth.getName(), req.vetDiagnosis(), req.treatment()));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteConsultation(@PathVariable Long id, Authentication auth) {
                consultationService.deleteConsultation(id, auth.getName());
                return ResponseEntity.noContent().build();
        }

        public record DiagnosisRequest(Long petId, String base64Image, String mimeType, String symptoms) {
        }

        public record VetReviewRequest(String vetDiagnosis, String treatment) {
        }
}
