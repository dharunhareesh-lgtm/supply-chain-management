package com.scms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Isolated table for DEMO demand forecasting data.
 * This table is completely decoupled from the real `orders` table
 * and has zero impact on warehouse operations, revenue, logistics, or real customer accounts.
 */
@Entity
@Table(name = "demo_demand_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemoDemandRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "period", nullable = false) // Format: "YYYY-MM" (e.g. "2026-07")
    private String period;

    @Column(name = "quantity", nullable = false)
    private Double quantity;

    @Column(name = "is_demo", nullable = false)
    private Boolean isDemo;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
