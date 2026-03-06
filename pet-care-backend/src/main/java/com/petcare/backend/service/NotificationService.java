package com.petcare.backend.service;

import com.petcare.backend.entity.Notification;

import java.util.List;

public interface NotificationService {

    /** Get all notifications for the current user (personal + broadcasts) */
    List<Notification> getNotificationsForUser(String userEmail);

    /** Send a notification to a specific user */
    Notification sendToUser(String senderEmail, Long recipientId, String title, String message, String type);

    /** Broadcast a notification to all users */
    Notification sendToAll(String senderEmail, String title, String message, String type);

    /** Mark a single notification as read */
    void markAsRead(Long notificationId, String userEmail);

    /** Mark all notifications as read for the current user */
    void markAllRead(String userEmail);

    /** Delete a notification (sender only) */
    void deleteNotification(Long notificationId, String callerEmail);

    /** Get notifications sent by the current vet/admin */
    List<Notification> getSentNotifications(String senderEmail);
}
