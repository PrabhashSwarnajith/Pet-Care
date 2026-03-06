package com.petcare.backend.repository;

import com.petcare.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Personal notifications sent to a specific user */
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long userId);

    /** Broadcast notifications (recipientUser is null = sent to everyone) */
    List<Notification> findByRecipientUserIsNullOrderByCreatedAtDesc();

    /** Notifications sent by a specific sender (vet/admin) */
    List<Notification> findBySenderUserIdOrderByCreatedAtDesc(Long senderId);
}
