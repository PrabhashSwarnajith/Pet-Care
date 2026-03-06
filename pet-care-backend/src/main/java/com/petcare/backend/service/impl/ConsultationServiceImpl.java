package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Consultation;
import com.petcare.backend.entity.Pet;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.ConsultationRepository;
import com.petcare.backend.repository.PetRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.ConsultationService;
import com.petcare.backend.service.PetHealthMLService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final PetHealthMLService healthService;

    @Override
    public Consultation analyzeAndSave(String ownerEmail, Long petId,
            String base64Image, String mimeType, String symptoms) {

        User owner = findUserByEmail(ownerEmail);

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found."));

        // Only the pet's owner can request a diagnosis for it
        if (!pet.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only get a diagnosis for your own pets.");
        }

        // Symptoms are required — the AI needs context to give a useful answer
        if (symptoms == null || symptoms.isBlank()) {
            throw new IllegalArgumentException("Please describe the symptoms before requesting an AI diagnosis.");
        }

        // Build a brief, friendly prompt for the analysis
        String aiPrompt = "The owner describes these pet symptoms: '" + symptoms + "'. " +
                "Keep response SHORT (3-4 sentences max) and friendly. " +
                "Mention: 1) Possible causes, 2) What they can do at home, 3) If they should see a vet soon. " +
                "Be casual and helpful, not formal.";

        // Analyze with image and description
        String analysisResponse = healthService.analyzeWithImage(base64Image, mimeType, aiPrompt);

        // Save the consultation record to the database
        Consultation consultation = Consultation.builder()
                .owner(owner)
                .pet(pet)
                .userDescription(symptoms)
                .imageUrl(base64Image != null && !base64Image.isBlank() ? "uploaded" : null)
                .aiPreliminaryDiagnosis(analysisResponse)
                .status(Consultation.Status.AI_REVIEWED)
                .build();

        return consultationRepository.save(consultation);
    }

    @Override
    public List<Consultation> getConsultationsForOwner(String ownerEmail) {
        User user = findUserByEmail(ownerEmail);

        // Vets and admins see ALL consultations so they can perform vet reviews
        if (user.getRole() == User.Role.VET || user.getRole() == User.Role.ADMIN) {
            return consultationRepository.findAll();
        }

        // Pet owners only see their own consultations
        return consultationRepository.findByOwnerId(user.getId());
    }

    @Override
    public Consultation updateVetDiagnosis(Long consultationId, String vetEmail,
            String vetDiagnosis, String treatment) {

        User vet = findUserByEmail(vetEmail);

        // Only vets and admins can finalize a diagnosis
        if (vet.getRole() != User.Role.VET && vet.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only veterinarians can add a final diagnosis.");
        }

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found."));

        // Attach the vet's final review to the consultation
        consultation.setVet(vet);
        consultation.setVetFinalDiagnosis(vetDiagnosis);
        consultation.setTreatmentRecommendation(treatment);
        consultation.setStatus(Consultation.Status.VET_REVIEWED);

        return consultationRepository.save(consultation);
    }


    @Override
    public Consultation getConsultationById(Long consultationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found."));

        boolean isOwner = consultation.getOwner().getId().equals(user.getId());
        boolean isVetOrAdmin = user.getRole() == User.Role.VET || user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isVetOrAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        return consultation;
    }

    @Override
    public void deleteConsultation(Long consultationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found."));

        boolean isOwner = consultation.getOwner().getId().equals(user.getId());
        if (!isOwner && user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own consultations.");
        }
        consultationRepository.delete(consultation);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
    }
}
