package com.scms.controller;

import com.scms.entity.Notification;
import com.scms.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<Notification> result = notificationRepository.findActiveNotifications(role, userId, search, pageRequest);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "userId", required = false) String userId) {
        long count = notificationRepository.countUnread(role, userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("id") Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "userId", required = false) String userId) {
        notificationRepository.markAllAsRead(role, userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveNotification(@PathVariable("id") Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setArchived(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("message", "Notification archived"));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable("id") Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            notificationRepository.delete(opt.get());
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        }
        return ResponseEntity.notFound().build();
    }
}
