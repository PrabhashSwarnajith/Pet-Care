package com.petcare.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "adoption_listings")
public class AdoptionListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String petName;
    private String species;
    private String breed;
    private Integer ageYears;
    private String gender;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;
    private String location;

    @Enumerated(EnumType.STRING)
    private AdoptionStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listed_by", nullable = false)
    private User listedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "adopted_by")
    private User adoptedBy;

    public enum AdoptionStatus {
        AVAILABLE,
        PENDING,
        ADOPTED
    }
}
