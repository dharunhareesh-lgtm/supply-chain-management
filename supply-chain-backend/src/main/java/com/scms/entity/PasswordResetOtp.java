package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
}
