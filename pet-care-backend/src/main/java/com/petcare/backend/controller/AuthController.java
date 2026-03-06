package com.petcare.backend.controller;

import com.petcare.backend.dto.AuthResponse;
import com.petcare.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthService authService;

        @PostMapping("/register")
        public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
                AuthResponse response = authService.register(
                                request.firstName(), request.lastName(),
                                request.email(), request.password(), request.role());
                return ResponseEntity.ok(response);
        }

        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
                AuthResponse response = authService.login(request.email(), request.password());
                return ResponseEntity.ok(response);
        }

        public record RegisterRequest(String firstName, String lastName, String email, String password, String role) {
        }

        public record LoginRequest(String email, String password) {
        }
}
