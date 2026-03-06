package com.petcare.backend.controller;

import com.petcare.backend.entity.EducationalContent;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.EducationalContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/education")
@RequiredArgsConstructor
public class EducationalContentController {

    private final EducationalContentService service;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<EducationalContent>> getAllContent(
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(service.getContentByCategory(category.toUpperCase()));
        }
        return ResponseEntity.ok(service.getAllContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EducationalContent> getContentById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getContentById(id));
    }


    @PostMapping
    public ResponseEntity<EducationalContent> createContent(
            @RequestBody ContentRequest req, Authentication auth) {
        verifyAdminOrVet(auth.getName());
        return ResponseEntity.ok(service.createContent(
                req.title(), req.content(), req.category(), req.type(), req.mediaUrl()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EducationalContent> updateContent(
            @PathVariable Long id, @RequestBody ContentRequest req, Authentication auth) {
        verifyAdminOrVet(auth.getName());
        return ResponseEntity.ok(service.updateContent(
                id, req.title(), req.content(), req.category(), req.type(), req.mediaUrl()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id, Authentication auth) {
        verifyAdminOrVet(auth.getName());
        service.deleteContent(id);
        return ResponseEntity.noContent().build();
    }


    private void verifyAdminOrVet(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.VET) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins or vets can manage educational content.");
        }
    }

    public record ContentRequest(String title, String content, String category, String type, String mediaUrl) {
    }
}
