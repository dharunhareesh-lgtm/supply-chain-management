package com.scms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "logistics_companies")
public class LogisticsCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String companyName;
    private String contactInfo;
    private String email;
    private String serviceRegions;
    private double companyRating;
    private String licenseDetails;
    private String status;

    public LogisticsCompany() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getServiceRegions() {
        return serviceRegions;
    }

    public void setServiceRegions(String serviceRegions) {
        this.serviceRegions = serviceRegions;
    }

    public double getCompanyRating() {
        return companyRating;
    }

    public void setCompanyRating(double companyRating) {
        this.companyRating = companyRating;
    }

    public String getLicenseDetails() {
        return licenseDetails;
    }

    public void setLicenseDetails(String licenseDetails) {
        this.licenseDetails = licenseDetails;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    private String vehiclePreferences;
    private String driverPreferences;
    private String notificationPreferences = "Email";

    public String getVehiclePreferences() { return vehiclePreferences; }
    public void setVehiclePreferences(String vehiclePreferences) { this.vehiclePreferences = vehiclePreferences; }
    public String getDriverPreferences() { return driverPreferences; }
    public void setDriverPreferences(String driverPreferences) { this.driverPreferences = driverPreferences; }
    public String getNotificationPreferences() { return notificationPreferences; }
    public void setNotificationPreferences(String notificationPreferences) { this.notificationPreferences = notificationPreferences; }
}
