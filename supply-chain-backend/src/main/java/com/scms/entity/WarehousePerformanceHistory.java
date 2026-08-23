package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouse_performance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehousePerformanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int warehouseId;
    private int supplierId;
    private int productId;
    
    private String productName;
    private String productCategory;
    
    private double distanceKm;
    private double warehouseTotalCapacity;
    private double warehouseAvailableCapacity;
    private double warehouseUtilizationPercentage;
    
    private double storageCostPerKg;
    private double quantityStored;
    private double marketPricePerKg;
    
    private Integer orderId;
    private Double orderQuantity;
    private String orderStatus;
    
    private LocalDateTime dispatchTime;
    private LocalDateTime deliveryTime;
    private Double fulfillmentDurationHours;
    private Boolean successfulFulfillment;
    
    private LocalDateTime recordedDate;
}
