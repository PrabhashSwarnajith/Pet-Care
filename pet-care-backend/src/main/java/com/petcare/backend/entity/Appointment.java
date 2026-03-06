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
@Table(name = "appointments")
public class Appointment {

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
    @JoinColumn(name = "vet_id", nullable = false)
    private User vet;

    private LocalDateTime appointmentTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(length = 500)
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    private ServiceType serviceType;

    public enum Status {
        SCHEDULED,
        COMPLETED,
        CANCELLED
    }

    public enum ServiceType {
        VET_VISIT,
        VIDEO_CONSULTATION,
        PET_SITTING,
        EMERGENCY
    }
}
