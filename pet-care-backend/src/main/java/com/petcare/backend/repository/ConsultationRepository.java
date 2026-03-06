package com.petcare.backend.repository;

import com.petcare.backend.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByOwnerId(Long ownerId);

    List<Consultation> findByVetId(Long vetId);

    List<Consultation> findByStatus(Consultation.Status status);
}
