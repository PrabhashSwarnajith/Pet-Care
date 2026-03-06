package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Pet;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.PetRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PetServiceImpl implements PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    @Override
    public List<Pet> getPetsByOwner(String ownerEmail) {
        User user = findUserByEmail(ownerEmail);
        // VETs and ADMINs can see all pets for oversight
        if (user.getRole() == User.Role.VET || user.getRole() == User.Role.ADMIN) {
            return petRepository.findAll();
        }
        return petRepository.findByOwnerId(user.getId());
    }

    @Override
    public Pet createPet(String ownerEmail, String name, String species, String breed,
            Integer age, Double weight, String medicalHistory) {
        User owner = findUserByEmail(ownerEmail);

        // A pet must have at least a name and species
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Pet name is required.");
        }
        if (species == null || species.isBlank()) {
            throw new IllegalArgumentException("Pet species is required (e.g. Dog, Cat).");
        }

        Pet pet = Pet.builder()
                .owner(owner)
                .name(name.trim())
                .species(species.trim())
                .breed(breed)
                .age(age)
                .weight(weight)
                .medicalHistory(medicalHistory)
                .build();

        return petRepository.save(pet);
    }

    @Override
    public Pet updatePet(Long petId, String ownerEmail, String name, String species, String breed,
            Integer age, Double weight, String medicalHistory) {

        // Fetch the pet and make sure it belongs to the requesting user
        Pet pet = findPetAndCheckOwnership(petId, ownerEmail);

        // Only update fields that were actually provided (not null or empty)
        if (name != null && !name.isBlank())
            pet.setName(name.trim());
        if (species != null && !species.isBlank())
            pet.setSpecies(species.trim());
        if (breed != null)
            pet.setBreed(breed);
        if (age != null)
            pet.setAge(age);
        if (weight != null)
            pet.setWeight(weight);
        if (medicalHistory != null)
            pet.setMedicalHistory(medicalHistory);

        return petRepository.save(pet);
    }

    @Override
    public void deletePet(Long petId, String ownerEmail) {
        Pet pet = findPetAndCheckOwnership(petId, ownerEmail);
        petRepository.delete(pet);
    }


    @Override
    public Pet getPetById(Long petId, String ownerEmail) {
        return findPetAndCheckOwnership(petId, ownerEmail);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
    }

    private Pet findPetAndCheckOwnership(Long petId, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found."));

        if (!pet.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own pets.");
        }

        return pet;
    }
}
