package com.petcare.backend.controller;

import com.petcare.backend.entity.Notification;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /** Get all notifications for the current user (personal + broadcasts) */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(Authentication auth) {
        List<NotificationDto> dtos = notificationService.getNotificationsForUser(auth.getName())
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    /** Send notification to a specific user (VET/ADMIN only) */
    @PostMapping("/send")
    public ResponseEntity<NotificationDto> sendToUser(@RequestBody SendRequest req, Authentication auth) {
        verifyVetOrAdmin(auth.getName());
        if (req.recipientId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient ID is required.");
        }
        Notification n = notificationService.sendToUser(
                auth.getName(), req.recipientId(), req.title(), req.message(), req.type());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(n));
    }

    /** Broadcast notification to all users (VET/ADMIN only) */
    @PostMapping("/broadcast")
    public ResponseEntity<NotificationDto> broadcast(@RequestBody SendRequest req, Authentication auth) {
        verifyVetOrAdmin(auth.getName());
        Notification n = notificationService.sendToAll(
                auth.getName(), req.title(), req.message(), req.type());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(n));
    }

    /** Mark single notification as read */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication auth) {
        notificationService.markAsRead(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    /** Mark all notifications as read */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.ok().build();
    }

    /** Delete a notification (VET/ADMIN only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, Authentication auth) {
        verifyVetOrAdmin(auth.getName());
        notificationService.deleteNotification(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    /** Get notifications sent by the current vet/admin */
    @GetMapping("/sent")
    public ResponseEntity<List<NotificationDto>> getSentNotifications(Authentication auth) {
        verifyVetOrAdmin(auth.getName());
        List<NotificationDto> dtos = notificationService.getSentNotifications(auth.getName())
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    /** Get list of users for recipient picker (VET/ADMIN only) */
    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getUsersForPicker(Authentication auth) {
        verifyVetOrAdmin(auth.getName());
        List<UserSummary> users = userRepository.findAll().stream()
                .map(u -> new UserSummary(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                        u.getRole().name()))
                .toList();
        return ResponseEntity.ok(users);
    }

    // ── Helpers ──

    private void verifyVetOrAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getRole() != User.Role.VET && user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only vets and admins can perform this action.");
        }
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType().name(),
                n.isRead(),
                n.getCreatedAt().toString(),
                n.getRecipientUser() != null
                        ? new UserSummary(n.getRecipientUser().getId(), n.getRecipientUser().getFirstName(),
                                n.getRecipientUser().getLastName(), n.getRecipientUser().getEmail(),
                                n.getRecipientUser().getRole().name())
                        : null,
                new UserSummary(n.getSenderUser().getId(), n.getSenderUser().getFirstName(),
                        n.getSenderUser().getLastName(), n.getSenderUser().getEmail(),
                        n.getSenderUser().getRole().name()),
                n.getRecipientUser() == null // isBroadcast
        );
    }

    // ── DTOs ──

    public record SendRequest(Long recipientId, String title, String message, String type) {
    }

    public record NotificationDto(Long id, String title, String message, String type,
            boolean read, String createdAt,
            UserSummary recipient, UserSummary sender, boolean broadcast) {
    }

    public record UserSummary(Long id, String firstName, String lastName, String email, String role) {
    }
}
