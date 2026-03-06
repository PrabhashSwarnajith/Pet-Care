package com.petcare.backend.controller;

import com.petcare.backend.entity.User;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers(Authentication auth) {
        verifyAdmin(auth.getName());
        List<UserDto> users = adminService.getAllUsers().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id,
            @RequestBody RoleUpdateRequest req,
            Authentication auth) {
        verifyAdmin(auth.getName());
        verifyNotSelf(id, auth.getName());
        User updated = adminService.updateUserRole(id, req.role());
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        verifyAdmin(auth.getName());
        verifyNotSelf(id, auth.getName());
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }


    private void verifyAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Admins only.");
        }
    }

    private void verifyNotSelf(Long targetId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (admin.getId().equals(targetId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot modify or delete your own admin account.");
        }
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getRole().name());
    }

    public record RoleUpdateRequest(String role) {
    }

    public record UserDto(Long id, String firstName, String lastName, String email, String role) {
    }
}
