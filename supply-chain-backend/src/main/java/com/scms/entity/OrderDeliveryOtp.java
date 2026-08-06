package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_delivery_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDeliveryOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer orderId;

    /** BCrypt-hashed OTP — never stored in plaintext */
    @Column(nullable = false)
    private String otpHash;

    /** DISPATCH or DELIVERY */
    @Column(nullable = false)
    private String otpType;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private boolean verified = false;

    /** Email of warehouse manager or logistics driver who verified */
    private String verifiedBy;

    /** Number of failed attempts — locked after 5 */
    private int attemptCount = 0;

    /** PENDING | VERIFIED | EXPIRED | LOCKED */
    private String status = "PENDING";
}
