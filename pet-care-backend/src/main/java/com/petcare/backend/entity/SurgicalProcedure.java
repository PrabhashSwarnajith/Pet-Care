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
@Table(name = "surgical_procedures")
public class SurgicalProcedure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String procedureName;

    @Column(columnDefinition = "TEXT")
    private String preOpInstructions;

    private LocalDateTime surgeryDateTime;

    @Column(columnDefinition = "TEXT")
    private String postOpNotes;

    @Enumerated(EnumType.STRING)
    private SurgicalStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vet_id")
    private User vet;

    public enum SurgicalStatus {
        SCHEDULED,
        PRE_OP,
        COMPLETED,
        CANCELLED
    }
}
