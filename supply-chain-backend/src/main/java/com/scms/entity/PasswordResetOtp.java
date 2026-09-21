package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_otps")
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String email;

    private String otp;

    private LocalDateTime createdTime;

    private LocalDateTime expiryTime;

    private boolean isUsed;

    private int failedAttempts;

    public PasswordResetOtp() {}

    public PasswordResetOtp(int id, String email, String otp, LocalDateTime createdTime, LocalDateTime expiryTime, boolean isUsed, int failedAttempts) {
        this.id = id;
        this.email = email;
        this.otp = otp;
        this.createdTime = createdTime;
        this.expiryTime = expiryTime;
        this.isUsed = isUsed;
        this.failedAttempts = failedAttempts;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }

    public LocalDateTime getExpiryTime() { return expiryTime; }
    public void setExpiryTime(LocalDateTime expiryTime) { this.expiryTime = expiryTime; }

    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { isUsed = used; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
}
