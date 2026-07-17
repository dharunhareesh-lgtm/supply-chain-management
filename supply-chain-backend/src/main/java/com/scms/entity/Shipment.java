package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int shipmentId;

    private Integer warehouseId;

    private int vehicleId;
    
    // We can store a comma-separated list of order IDs for simplicity
    private String orderIds; // e.g., "1,2,3"

    private String status; // "Draft", "Confirmed", "In Transit", "Delivered"

    private double totalDistanceKm;
    
    private double estimatedTimeHours;
    
    private double totalFuelEstimateLiters;
    
    private double totalCost;
    
    @Column(columnDefinition = "LONGTEXT")
    private String routeJson; // JSON representation of the sorted route [Warehouse, Customer A, Customer B]
}