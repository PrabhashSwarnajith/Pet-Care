package com.petcare.backend.service.impl;

import com.petcare.backend.entity.Notification;
import com.petcare.backend.entity.User;
import com.petcare.backend.repository.NotificationRepository;
import com.petcare.backend.repository.UserRepository;
import com.petcare.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<Notification> getNotificationsForUser(String userEmail) {
        User user = findUser(userEmail);

        // Combine personal notifications + broadcast notifications
        List<Notification> personal = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(user.getId());
        List<Notification> broadcasts = notificationRepository.findByRecipientUserIsNullOrderByCreatedAtDesc();

        // Merge and sort by createdAt descending
        Set<Long> seen = new HashSet<>();
        List<Notification> merged = new ArrayList<>();
        for (Notification n : personal) {
            if (seen.add(n.getId()))
                merged.add(n);
        }
        for (Notification n : broadcasts) {
            if (seen.add(n.getId()))
                merged.add(n);
        }
        merged.sort(Comparator.comparing(Notification::getCreatedAt).reversed());
        return merged;
    }

    @Override
    public Notification sendToUser(String senderEmail, Long recipientId, String title, String message, String type) {
        User sender = findUser(senderEmail);
        verifyVetOrAdmin(sender);

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient user not found."));

        Notification notification = Notification.builder()
                .title(title.trim())
                .message(message.trim())
                .type(parseType(type))
                .senderUser(sender)
                .recipientUser(recipient)
                .build();

        return notificationRepository.save(notification);
    }

    @Override
    public Notification sendToAll(String senderEmail, String title, String message, String type) {
        User sender = findUser(senderEmail);
        verifyVetOrAdmin(sender);

        Notification notification = Notification.builder()
                .title(title.trim())
                .message(message.trim())
                .type(parseType(type))
                .senderUser(sender)
                .recipientUser(null) // null = broadcast
                .build();

        return notificationRepository.save(notification);
    }

    @Override
    public void markAsRead(Long notificationId, String userEmail) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllRead(String userEmail) {
        User user = findUser(userEmail);
        List<Notification> all = getNotificationsForUser(userEmail);
        for (Notification n : all) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }

    @Override
    public void deleteNotification(Long notificationId, String callerEmail) {
        User caller = findUser(callerEmail);
        verifyVetOrAdmin(caller);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));

        notificationRepository.delete(notification);
    }

    @Override
    public List<Notification> getSentNotifications(String senderEmail) {
        User sender = findUser(senderEmail);
        verifyVetOrAdmin(sender);
        return notificationRepository.findBySenderUserIdOrderByCreatedAtDesc(sender.getId());
    }

    // ── Helpers ──

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
    }

    private void verifyVetOrAdmin(User user) {
        if (user.getRole() != User.Role.VET && user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only vets and admins can manage notifications.");
        }
    }

    private Notification.NotificationType parseType(String type) {
        try {
            return Notification.NotificationType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            return Notification.NotificationType.INFO;
        }
    }
}
