package com.petcare.backend.service;

import com.petcare.backend.entity.AdoptionListing;

import java.util.List;

public interface AdoptionListingService {

    List<AdoptionListing> getAllAvailableListings();

    List<AdoptionListing> getMyListings(String userEmail);

    AdoptionListing createListing(String listerEmail, String petName, String species,
                                  String breed, Integer ageYears, String gender,
                                  String description, String imageUrl, String location);

    AdoptionListing requestAdoption(Long listingId, String requesterEmail);

    AdoptionListing approveAdoption(Long listingId, String listerEmail);

    void deleteListing(Long listingId, String listerEmail);
}
