package com.scms.dto;

public class EnhancedRegisterCustomerRequest {

    private String fullName;
    private String email;
    private String mobileNumber;
    private String location;
    private String password;
    private String confirmPassword;
    private String otp;

    public EnhancedRegisterCustomerRequest() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
