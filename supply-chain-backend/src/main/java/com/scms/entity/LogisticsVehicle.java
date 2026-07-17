package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "logistics_vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String vehicleNumber;
    private String vehicleType;
    
    @Column(columnDefinition = "LONGTEXT")
    private String vehiclePhoto; // base64 or URL
    
    private int capacityKg;
    private int availableSpaceKg;
    private int currentLoadKg;
    
    private String driverName;
    private String driverContact;
    private boolean isAvailable = true;
    
    // New fields for Real-Time Location & Status
    private Double latitude;
    private Double longitude;
    private String status = "AVAILABLE"; // AVAILABLE, RESERVED, LOADING, IN_TRANSIT, DELIVERED, MAINTENANCE, OFFLINE
    
    private Integer currentOrderId;
    private String currentDriverId;
    private Double lastDeliveryLatitude;
    private Double lastDeliveryLongitude;
    private String lastUpdated;

    private String serviceRegion;
    private String companyName;
    private double rating = 4.0;
    private double transportCostPerKg = 5.0; // standard fallback
}
