package com.scms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "managers")
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int managerId;

    private String username;

    private String email;

    private String password;

    private String category;

    private String status;

    private Integer warehouseId; 
    private Integer categoryId;  
    private String createdDate = java.time.LocalDate.now().toString();
    private String otpStatus = "PENDING";
    private Boolean isWarehouseAccount = false; 

    private String contactNumber;
    private String notificationPreferences = "Email";

    @Transient
    private String otp;

    public Manager() {}

    public Manager(int managerId, String username, String email, String password, String category, String status,
                   Integer warehouseId, Integer categoryId, String createdDate, String otpStatus,
                   Boolean isWarehouseAccount, String contactNumber, String notificationPreferences, String otp) {
        this.managerId = managerId;
        this.username = username;
        this.email = email;
        this.password = password;
        this.category = category;
        this.status = status;
        this.warehouseId = warehouseId;
        this.categoryId = categoryId;
        this.createdDate = createdDate;
        this.otpStatus = otpStatus;
        this.isWarehouseAccount = isWarehouseAccount;
        this.contactNumber = contactNumber;
        this.notificationPreferences = notificationPreferences;
        this.otp = otp;
    }

    public int getManagerId() { return managerId; }
    public void setManagerId(int managerId) { this.managerId = managerId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Integer warehouseId) { this.warehouseId = warehouseId; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }

    public String getOtpStatus() { return otpStatus; }
    public void setOtpStatus(String otpStatus) { this.otpStatus = otpStatus; }

    public Boolean getIsWarehouseAccount() { return isWarehouseAccount; }
    public void setIsWarehouseAccount(Boolean isWarehouseAccount) { this.isWarehouseAccount = isWarehouseAccount; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getNotificationPreferences() { return notificationPreferences; }
    public void setNotificationPreferences(String notificationPreferences) { this.notificationPreferences = notificationPreferences; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}