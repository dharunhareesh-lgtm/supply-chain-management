package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int orderId;
    private int supplierId;
    private int warehouseId;
    private Integer logisticsId; // nullable for self pickup

    private double supplierAmount;
    private double warehouseAmount;
    private double logisticsAmount;
    private double platformFee;

    private String status; // PENDING_DISTRIBUTION, DISTRIBUTED
    private String settledAt;
    private String txnReference;
    private String paymentMethod;

    // Financial Distribution audit fields
    private String distributionDate;
    private String distributedBy;
    private String remarks;
}
