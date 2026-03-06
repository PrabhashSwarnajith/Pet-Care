package com.petcare.backend.service;

import com.petcare.backend.entity.User;

import java.util.List;

public interface AdminService {
    List<User> getAllUsers();

    void deleteUser(Long userId);

    User updateUserRole(Long userId, String newRole);
}
