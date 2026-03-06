package com.petcare.backend.dto;

public record AuthResponse(
        String token,
        UserDto user) {
    public record UserDto(
            Long id,
            String firstName,
            String lastName,
            String email,
            String role) {
    }
}
