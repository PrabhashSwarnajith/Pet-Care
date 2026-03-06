package com.petcare.backend.service.impl;

import com.petcare.backend.dto.AuthResponse;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.security.JwtService;
import com.petcare.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // scrambles passwords so we never store plain text
    private final JwtService jwtService; // creates login tokens
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(String firstName, String lastName, String email, String password, String role) {

        // Make sure the email is not already taken
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("This email is already registered. Please log in instead.");
        }

        // Password must be at least 8 characters
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        // Determine the role — only USER and VET are allowed on self-registration
        User.Role userRole = User.Role.USER;
        if ("VET".equalsIgnoreCase(role)) {
            userRole = User.Role.VET;
        }

        // Build the new user object and encrypt the password before saving
        User newUser = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(userRole)
                .build();

        User savedUser = userRepository.save(newUser);

        // Create a JWT token so the user is immediately logged in after registering
        String token = jwtService.generateToken(savedUser);

        return buildResponse(token, savedUser);
    }

    @Override
    public AuthResponse login(String email, String password) {

        // Spring Security checks the email + password against the database for us
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            throw new BadCredentialsException("Incorrect email or password. Please try again.");
        }

        // Load the user and issue a new JWT token
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        String token = jwtService.generateToken(user);

        return buildResponse(token, user);
    }

    // Builds a clean response object with the token and user details
    private AuthResponse buildResponse(String token, User user) {
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name());
        return new AuthResponse(token, userDto);
    }
}
