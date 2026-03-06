package com.petcare.backend.repository;

import com.petcare.backend.entity.AdoptionListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdoptionListingRepository extends JpaRepository<AdoptionListing, Long> {

    List<AdoptionListing> findByStatus(AdoptionListing.AdoptionStatus status);

    List<AdoptionListing> findByListedById(Long userId);
}
