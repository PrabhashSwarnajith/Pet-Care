package com.petcare.backend.controller;

import com.petcare.backend.entity.Pet;
import com.petcare.backend.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @GetMapping
    public ResponseEntity<List<Pet>> getMyPets(Authentication auth) {
        return ResponseEntity.ok(petService.getPetsByOwner(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pet> getPetById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(petService.getPetById(id, auth.getName()));
    }

    @PostMapping
    public ResponseEntity<Pet> createPet(@RequestBody PetRequest req, Authentication auth) {
        return ResponseEntity.ok(petService.createPet(
                auth.getName(), req.name(), req.species(), req.breed(),
                req.age(), req.weight(), req.medicalHistory()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pet> updatePet(@PathVariable Long id,
            @RequestBody PetRequest req,
            Authentication auth) {
        return ResponseEntity.ok(petService.updatePet(
                id, auth.getName(), req.name(), req.species(), req.breed(),
                req.age(), req.weight(), req.medicalHistory()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable Long id, Authentication auth) {
        petService.deletePet(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    public record PetRequest(String name, String species, String breed,
            Integer age, Double weight, String medicalHistory) {
    }
}
