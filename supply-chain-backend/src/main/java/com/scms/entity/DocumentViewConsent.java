package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tracks admin requests to view a customer's KYC document.
 * The customer must explicitly approve before the admin can access the S3 presigned URL.
 * Access is one-time and expires 15 minutes after approval.
 */
@Entity
@Table(name = "document_view_consents")
public class DocumentViewConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The admin who requested access
    @Column(nullable = false)
    private String adminEmail;

    // The customer whose document is requested
    @Column(nullable = false)
    private String customerEmail;

    // The VerificationDocument ID that is being requested
    @Column(nullable = false)
    private Long verificationDocumentId;

    // Status: PENDING, APPROVED, REJECTED, USED, EXPIRED
    @Column(nullable = false)
    private String status = "PENDING";

    // Set when customer approves — access expires 15 min after this
    private LocalDateTime approvedAt;

    // Set when the admin actually views the document (one-time use)
    private LocalDateTime usedAt;

    // When the request was created
    @Column(nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    // Optional message from admin to customer explaining why they need access
    @Column(columnDefinition = "TEXT")
    private String requestReason;

    public DocumentViewConsent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public Long getVerificationDocumentId() { return verificationDocumentId; }
    public void setVerificationDocumentId(Long verificationDocumentId) { this.verificationDocumentId = verificationDocumentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public String getRequestReason() { return requestReason; }
    public void setRequestReason(String requestReason) { this.requestReason = requestReason; }
}
