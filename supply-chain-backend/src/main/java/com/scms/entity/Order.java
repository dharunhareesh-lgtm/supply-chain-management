package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int orderId;

    private String customerName;

    private String productName;

    private int quantity;

    private String status;

    private String orderDate = java.time.LocalDate.now().toString();

    private String packageDetails; // JSON serialization of packages e.g. [{"packageSize": 50, "bagCount": 20}]

    // Real-Time Location Optimization Fields
    private Double customerLatitude;
    private Double customerLongitude;
    
    // Using a fixed warehouse location for this order, can be populated during creation
    private Double warehouseLatitude;
    private Double warehouseLongitude;

    private Integer customerId;
    private Integer productId;
    private Integer supplierId;
    private Integer warehouseId;
    private Integer inventoryId;
    private Integer logisticsId;
    private Integer vehicleId;
    private String dispatchStatus = "PENDING";
    private String deliveryStatus = "PENDING";

    // Financial fields — computed on order creation from product pricing plan
    private Double grossRevenue = 0.0;
    private Double warehouseDeduction = 0.0;
    private Double netSupplierAmount = 0.0;
    private String settlementStatus = "PENDING";
    private String paymentStatus = "PENDING";
    private String settlementDate;
    private String paymentReference;

    // Enterprise Marketplace Workflow Fields
    private String deliveryOption = "PLATFORM_LOGISTICS"; // PLATFORM_LOGISTICS, SELF_PICKUP
    private String paymentMethod = "UPI"; // UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET, COD
    private Double estimatedDeliveryCharge = 0.0;
    private Double finalDeliveryCharge = 0.0;
    private Double remainingAmountPaid = 0.0;

    private String dispatchOtp;
    private String otpGeneratedTime; // String ISO-8601 representation

    @Transient
    private java.util.List<ProductPackage> packageBreakdown;
}