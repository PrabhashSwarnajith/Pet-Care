package com.petcare.backend.service.impl;

import com.petcare.backend.entity.AdoptionListing;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.AdoptionListingRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.AdoptionListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdoptionListingServiceImpl implements AdoptionListingService {

    private final AdoptionListingRepository adoptionRepository;
    private final UserRepository userRepository;

    @Override
    public List<AdoptionListing> getAllAvailableListings() {
        // Return AVAILABLE + PENDING so adopters can see them all
        return adoptionRepository.findAll().stream()
                .filter(l -> l.getStatus() != AdoptionListing.AdoptionStatus.ADOPTED)
                .toList();
    }

    @Override
    public List<AdoptionListing> getMyListings(String userEmail) {
        User user = findUser(userEmail);
        return adoptionRepository.findByListedById(user.getId());
    }

    @Override
    public AdoptionListing createListing(String listerEmail, String petName, String species,
                                         String breed, Integer ageYears, String gender,
                                         String description, String imageUrl, String location) {
        User lister = findUser(listerEmail);

        if (petName == null || petName.isBlank()) {
            throw new IllegalArgumentException("Pet name is required.");
        }
        if (species == null || species.isBlank()) {
            throw new IllegalArgumentException("Species is required.");
        }

        AdoptionListing listing = AdoptionListing.builder()
                .petName(petName.trim())
                .species(species.trim())
                .breed(breed)
                .ageYears(ageYears)
                .gender(gender)
                .description(description)
                .imageUrl(imageUrl)
                .location(location)
                .status(AdoptionListing.AdoptionStatus.AVAILABLE)
                .listedBy(lister)
                .adoptedBy(null)
                .build();

        return adoptionRepository.save(listing);
    }

    @Override
    public AdoptionListing requestAdoption(Long listingId, String requesterEmail) {
        User requester = findUser(requesterEmail);
        AdoptionListing listing = findListing(listingId);

        // Can't adopt your own listing
        if (listing.getListedBy().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot request to adopt your own listing.");
        }

        if (listing.getStatus() != AdoptionListing.AdoptionStatus.AVAILABLE) {
            throw new IllegalArgumentException("This pet is no longer available for adoption.");
        }

        listing.setStatus(AdoptionListing.AdoptionStatus.PENDING);
        listing.setAdoptedBy(requester);
        return adoptionRepository.save(listing);
    }

    @Override
    public AdoptionListing approveAdoption(Long listingId, String listerEmail) {
        User lister = findUser(listerEmail);
        AdoptionListing listing = findListing(listingId);

        if (!listing.getListedBy().getId().equals(lister.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the person who listed this pet can approve the adoption.");
        }

        if (listing.getStatus() != AdoptionListing.AdoptionStatus.PENDING) {
            throw new IllegalArgumentException("There is no pending adoption request for this listing.");
        }

        listing.setStatus(AdoptionListing.AdoptionStatus.ADOPTED);
        return adoptionRepository.save(listing);
    }

    @Override
    public void deleteListing(Long listingId, String listerEmail) {
        User lister = findUser(listerEmail);
        AdoptionListing listing = findListing(listingId);

        if (!listing.getListedBy().getId().equals(lister.getId()) && lister.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own listings.");
        }

        if (listing.getStatus() == AdoptionListing.AdoptionStatus.ADOPTED) {
            throw new IllegalArgumentException("Cannot delete a listing that has already been adopted.");
        }

        adoptionRepository.delete(listing);
    }


    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private AdoptionListing findListing(Long id) {
        return adoptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adoption listing not found."));
    }
}
