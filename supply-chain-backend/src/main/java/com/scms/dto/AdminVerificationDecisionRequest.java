package com.scms.dto;

public class AdminVerificationDecisionRequest {

    private String adminEmail;
    private String remarks;

    public AdminVerificationDecisionRequest() {}

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
