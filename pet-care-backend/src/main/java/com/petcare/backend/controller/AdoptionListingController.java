package com.petcare.backend.controller;

import com.petcare.backend.entity.AdoptionListing;
import com.petcare.backend.service.AdoptionListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adoptions")
@RequiredArgsConstructor
public class AdoptionListingController {

    private final AdoptionListingService adoptionService;

    @GetMapping
    public ResponseEntity<List<AdoptionListing>> getAvailableListings() {
        return ResponseEntity.ok(adoptionService.getAllAvailableListings());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<AdoptionListing>> getMyListings(Authentication auth) {
        return ResponseEntity.ok(adoptionService.getMyListings(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<AdoptionListing> createListing(@RequestBody ListingRequest req,
                                                          Authentication auth) {
        return ResponseEntity.ok(adoptionService.createListing(
                auth.getName(), req.petName(), req.species(), req.breed(),
                req.ageYears(), req.gender(), req.description(), req.imageUrl(), req.location()));
    }

    @PutMapping("/{id}/request")
    public ResponseEntity<AdoptionListing> requestAdoption(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adoptionService.requestAdoption(id, auth.getName()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<AdoptionListing> approveAdoption(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adoptionService.approveAdoption(id, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id, Authentication auth) {
        adoptionService.deleteListing(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    public record ListingRequest(
            String petName,
            String species,
            String breed,
            Integer ageYears,
            String gender,
            String description,
            String imageUrl,
            String location
    ) {}
}
