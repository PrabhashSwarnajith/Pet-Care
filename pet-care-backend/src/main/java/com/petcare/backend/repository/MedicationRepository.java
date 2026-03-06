package com.petcare.backend.repository;

import com.petcare.backend.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {

    List<Medication> findByPetId(Long petId);

    List<Medication> findByOwnerId(Long ownerId);
}
