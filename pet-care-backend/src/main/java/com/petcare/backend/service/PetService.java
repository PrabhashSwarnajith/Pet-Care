package com.petcare.backend.service;

import com.petcare.backend.entity.Pet;

import java.util.List;

public interface PetService {
    List<Pet> getPetsByOwner(String ownerEmail);

    Pet getPetById(Long petId, String ownerEmail);

    Pet createPet(String ownerEmail, String name, String species, String breed, Integer age, Double weight,
            String medicalHistory);

    Pet updatePet(Long petId, String ownerEmail, String name, String species, String breed, Integer age, Double weight,
            String medicalHistory);

    void deletePet(Long petId, String ownerEmail);
}
