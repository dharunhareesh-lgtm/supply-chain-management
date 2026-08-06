package com.scms.dto;

public class BusinessUpgradeRequest {

    private String email;
    private String businessName;
    private String businessAddress;
    private String businessPan;
    private String gstNumber;

    public BusinessUpgradeRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getBusinessAddress() { return businessAddress; }
    public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }

    public String getBusinessPan() { return businessPan; }
    public void setBusinessPan(String businessPan) { this.businessPan = businessPan; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
}
