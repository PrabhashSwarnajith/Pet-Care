package com.petcare.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "consultations")
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vet_id")
    private User vet; // The vet who reviewed it, nullable initially

    @Column(columnDefinition = "TEXT")
    private String userDescription; // Symptoms described by the user

    private String imageUrl; // URL/Path to the uploaded image

    @Column(columnDefinition = "TEXT")
    private String aiPreliminaryDiagnosis; // Initial diagnosis from Gemini API

    @Column(columnDefinition = "TEXT")
    private String vetFinalDiagnosis; // Manual review by a vet

    @Column(columnDefinition = "TEXT")
    private String treatmentRecommendation;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = Status.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING, // Waiting for AI or Vet
        AI_REVIEWED, // AI gave preliminary advice
        VET_REVIEWED, // Vet gave final advice
        RESOLVED
    }
}
