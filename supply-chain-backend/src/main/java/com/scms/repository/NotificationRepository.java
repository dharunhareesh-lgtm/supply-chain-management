package com.scms.repository;

import com.scms.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.isArchived = false AND " +
           "(n.role = :role OR :role IS NULL) AND " +
           "(n.userId = :userId OR n.userId IS NULL OR :userId IS NULL) AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(n.description) LIKE LOWER(CONCAT('%', :search, '%')) OR :search IS NULL)")
    Page<Notification> findActiveNotifications(
            @Param("role") String role,
            @Param("userId") String userId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = false AND n.isArchived = false AND " +
           "(n.role = :role OR :role IS NULL) AND " +
           "(n.userId = :userId OR n.userId IS NULL OR :userId IS NULL)")
    long countUnread(@Param("role") String role, @Param("userId") String userId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.isRead = false AND " +
           "(n.role = :role OR :role IS NULL) AND " +
           "(n.userId = :userId OR n.userId IS NULL OR :userId IS NULL)")
    void markAllAsRead(@Param("role") String role, @Param("userId") String userId);
}
