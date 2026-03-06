package com.petcare.backend.service;

import com.petcare.backend.entity.Consultation;

import java.util.List;

public interface ConsultationService {
    Consultation analyzeAndSave(String ownerEmail, Long petId, String base64Image, String mimeType, String symptoms);

    List<Consultation> getConsultationsForOwner(String ownerEmail);

    Consultation getConsultationById(Long consultationId, String userEmail);

    Consultation updateVetDiagnosis(Long consultationId, String vetEmail, String vetDiagnosis, String treatment);

    void deleteConsultation(Long consultationId, String userEmail);
}
