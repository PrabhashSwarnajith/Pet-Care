package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Medication;
import com.petcare.backend.entity.Pet;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.MedicationRepository;
import com.petcare.backend.repository.PetRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.MedicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationServiceImpl implements MedicationService {

    private final MedicationRepository medicationRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    @Override
    public List<Medication> getMedicationsForPet(Long petId, String callerEmail) {
        User caller = findUser(callerEmail);
        Pet pet = findPet(petId);

        // Only the pet's owner, VETs, or ADMINs can view medications
        if (!pet.getOwner().getId().equals(caller.getId())
                && caller.getRole() != User.Role.ADMIN
                && caller.getRole() != User.Role.VET) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only view medications for your own pets.");
        }

        return medicationRepository.findByPetId(petId);
    }

    @Override
    public Medication addMedication(String ownerEmail, Long petId, String name, String dosage,
                                    String frequency, LocalDate startDate, LocalDate endDate, String notes) {
        User owner = findUser(ownerEmail);
        Pet pet = findPet(petId);

        if (!pet.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only add medications for your own pets.");
        }

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Medication name is required.");
        }

        Medication medication = Medication.builder()
                .name(name.trim())
                .dosage(dosage)
                .frequency(frequency)
                .startDate(startDate)
                .endDate(endDate)
                .notes(notes)
                .pet(pet)
                .owner(owner)
                .build();

        return medicationRepository.save(medication);
    }

    @Override
    public Medication updateMedication(Long medicationId, String ownerEmail, String name, String dosage,
                                       String frequency, LocalDate startDate, LocalDate endDate, String notes) {
        User owner = findUser(ownerEmail);
        Medication med = findMedication(medicationId);

        if (!med.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only update your own medication records.");
        }

        med.setName(name == null || name.isBlank() ? med.getName() : name.trim());
        med.setDosage(dosage);
        med.setFrequency(frequency);
        med.setStartDate(startDate);
        med.setEndDate(endDate);
        med.setNotes(notes);

        return medicationRepository.save(med);
    }

    @Override
    public void deleteMedication(Long medicationId, String ownerEmail) {
        User owner = findUser(ownerEmail);
        Medication med = findMedication(medicationId);

        if (!med.getOwner().getId().equals(owner.getId()) && owner.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own medication records.");
        }

        medicationRepository.delete(med);
    }


    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private Pet findPet(Long id) {
        return petRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found."));
    }

    private Medication findMedication(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medication record not found."));
    }
}
