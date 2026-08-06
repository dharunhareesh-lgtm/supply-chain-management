package com.scms.dto;

import com.scms.entity.CustomerProfile;
import com.scms.entity.CustomerVerification;
import com.scms.entity.OcrExtraction;
import com.scms.entity.VerificationDocument;

import java.util.List;

public class AdminVerificationDetailResponse {

    private CustomerVerification verification;
    private CustomerProfile customerProfile;
    private OcrExtraction ocrExtraction;
    private List<VerificationDocument> documents;

    public AdminVerificationDetailResponse() {}

    public AdminVerificationDetailResponse(CustomerVerification verification, CustomerProfile customerProfile, OcrExtraction ocrExtraction, List<VerificationDocument> documents) {
        this.verification = verification;
        this.customerProfile = customerProfile;
        this.ocrExtraction = ocrExtraction;
        this.documents = documents;
    }

    public CustomerVerification getVerification() { return verification; }
    public void setVerification(CustomerVerification verification) { this.verification = verification; }

    public CustomerProfile getCustomerProfile() { return customerProfile; }
    public void setCustomerProfile(CustomerProfile customerProfile) { this.customerProfile = customerProfile; }

    public OcrExtraction getOcrExtraction() { return ocrExtraction; }
    public void setOcrExtraction(OcrExtraction ocrExtraction) { this.ocrExtraction = ocrExtraction; }

    public List<VerificationDocument> getDocuments() { return documents; }
    public void setDocuments(List<VerificationDocument> documents) { this.documents = documents; }
}
