package com.scms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "warehouse_location")
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
    private Double totalCapacity;
    private Boolean coldStorageAvailable = false;
    private Double coldStorageCapacity;
    private String managerName;

    public WarehouseLocation() {}

    public WarehouseLocation(int id, String warehouseName, String registeredEmail, String address, String district, String state, Double latitude, Double longitude, String country, String postalCode, Double coverageRadiusKm, String lastUpdated, String contactNumber, String workingHours, String storageInformation, String securitySettings, String notificationPreferences, String status) {
        this.id = id;
        this.warehouseName = warehouseName;
        this.registeredEmail = registeredEmail;
        this.address = address;
        this.district = district;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.country = country;
        this.postalCode = postalCode;
        this.coverageRadiusKm = coverageRadiusKm;
        this.lastUpdated = lastUpdated;
        this.contactNumber = contactNumber;
        this.workingHours = workingHours;
        this.storageInformation = storageInformation;
        this.securitySettings = securitySettings;
        this.notificationPreferences = notificationPreferences;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }

    public String getRegisteredEmail() { return registeredEmail; }
    public void setRegisteredEmail(String registeredEmail) { this.registeredEmail = registeredEmail; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public Double getCoverageRadiusKm() { return coverageRadiusKm; }
    public void setCoverageRadiusKm(Double coverageRadiusKm) { this.coverageRadiusKm = coverageRadiusKm; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public String getStorageInformation() { return storageInformation; }
    public void setStorageInformation(String storageInformation) { this.storageInformation = storageInformation; }

    public String getSecuritySettings() { return securitySettings; }
    public void setSecuritySettings(String securitySettings) { this.securitySettings = securitySettings; }

    public String getNotificationPreferences() { return notificationPreferences; }
    public void setNotificationPreferences(String notificationPreferences) { this.notificationPreferences = notificationPreferences; }

    public String getStatus() {
        return this.status == null ? "ACTIVE" : this.status;
    }
    public void setStatus(String status) { this.status = status; }

    public Double getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(Double totalCapacity) { this.totalCapacity = totalCapacity; }

    public Boolean getColdStorageAvailable() { return coldStorageAvailable != null && coldStorageAvailable; }
    public void setColdStorageAvailable(Boolean coldStorageAvailable) { this.coldStorageAvailable = coldStorageAvailable; }

    public Double getColdStorageCapacity() { return coldStorageCapacity; }
    public void setColdStorageCapacity(Double coldStorageCapacity) { this.coldStorageCapacity = coldStorageCapacity; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
}
