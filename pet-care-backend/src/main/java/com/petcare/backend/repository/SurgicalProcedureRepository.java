package com.petcare.backend.repository;

import com.petcare.backend.entity.SurgicalProcedure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurgicalProcedureRepository extends JpaRepository<SurgicalProcedure, Long> {

    List<SurgicalProcedure> findByOwnerId(Long ownerId);

    List<SurgicalProcedure> findByVetId(Long vetId);
}
