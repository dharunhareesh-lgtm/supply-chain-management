package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_location")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String warehouseName;
    private String registeredEmail;
    private String address;
    private String district;
    private String state;
    private Double latitude;
    private Double longitude;

    private String country;
    private String postalCode;
    private Double coverageRadiusKm;
    private String lastUpdated;

    private String contactNumber;
    private String workingHours;
    private String storageInformation;
    private String securitySettings;
    private String notificationPreferences = "Email";

    private String status = "ACTIVE";

    public String getStatus() {
        return this.status == null ? "ACTIVE" : this.status;
    }
}
