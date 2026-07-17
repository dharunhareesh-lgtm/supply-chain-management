package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(length = 1000)
    private String description;
    
    private String type; // e.g. "ORDER", "VEHICLE", "SYSTEM", "INVENTORY", "PAYMENT", "REGISTRATION"
    
    private String priority; // CRITICAL, WARNING, SUCCESS, INFO
    
    private Integer orderId;
    
    private String timestamp = java.time.LocalDateTime.now().toString();
    
    private boolean isRead = false;
    
    private boolean isArchived = false;
    
    private String userId; // Target user's email or username
    
    private String role; // Target role e.g. "ADMIN", "SUPPLIER", "WAREHOUSE", "LOGISTICS", "CUSTOMER"
}
