package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "managers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int managerId;

    private String username;

    private String email;

    private String password;

    private String category;

    private String status;

    private Integer warehouseId; // Relates to exactly one WarehouseLocation
    private Integer categoryId;  // Category identifier
    private String createdDate = java.time.LocalDate.now().toString();
    private String otpStatus = "PENDING";
    private Boolean isWarehouseAccount = false; // Flag to differentiate managers from warehouse base accounts

    private String contactNumber;
    private String notificationPreferences = "Email";

    @Transient
    private String otp;
}