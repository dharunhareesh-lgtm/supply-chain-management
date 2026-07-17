package com.scms.service;

import com.scms.entity.Notification;
import com.scms.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification sendNotification(String title, String description, String type, String priority, Integer orderId, String userId, String role) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setDescription(description);
        notification.setType(type);
        notification.setPriority(priority);
        notification.setOrderId(orderId);
        notification.setUserId(userId);
        notification.setRole(role);
        notification.setTimestamp(LocalDateTime.now().toString());
        notification.setRead(false);
        notification.setArchived(false);
        return notificationRepository.save(notification);
    }
}
