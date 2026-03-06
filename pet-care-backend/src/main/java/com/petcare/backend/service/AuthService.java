package com.petcare.backend.service;

import com.petcare.backend.dto.AuthResponse;

public interface AuthService {
    AuthResponse register(String firstName, String lastName, String email, String password, String role);

    AuthResponse login(String email, String password);
}
