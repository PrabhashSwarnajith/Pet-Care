package com.petcare.backend.service;

import com.petcare.backend.entity.Medication;

import java.time.LocalDate;
import java.util.List;

public interface MedicationService {

    List<Medication> getMedicationsForPet(Long petId, String callerEmail);

    Medication addMedication(String ownerEmail, Long petId, String name, String dosage,
                             String frequency, LocalDate startDate, LocalDate endDate, String notes);

    Medication updateMedication(Long medicationId, String ownerEmail, String name, String dosage,
                                String frequency, LocalDate startDate, LocalDate endDate, String notes);

    void deleteMedication(Long medicationId, String ownerEmail);
}
