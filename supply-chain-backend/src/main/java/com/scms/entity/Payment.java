package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int orderId;
    private String paymentId; // Gateway ref id
    private String transactionId;
    private double amount;
    private String gateway; // RAZORPAY, COD, etc.
    private String paymentStatus; // PENDING, PARTIAL_PAID, PAID, COMPLETED
    private String paymentTime;
    private double advanceAmount;
    private double remainingAmount;
}
