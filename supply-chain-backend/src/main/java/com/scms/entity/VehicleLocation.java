package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vehicle_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int vehicleId;
    private int logisticsCompanyId;
    private String vehicleNumber;
    private String driverName;
    private Double latitude;
    private Double longitude;
    private String status;
    private String currentRoute;
}
