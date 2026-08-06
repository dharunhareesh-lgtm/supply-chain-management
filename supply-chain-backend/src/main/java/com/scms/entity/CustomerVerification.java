package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_verifications")
public class CustomerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String documentType; // PAN, DRIVING_LICENSE, VOTER_ID, PASSPORT

    private String gstNumber;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, UNDER_REVIEW, APPROVED, REJECTED, REUPLOAD_REQUIRED, OCR_FAILED, MANUAL_REVIEW_REQUESTED

    private Double nameSimilarityPercentage;

    private boolean nameMatchPassed;

    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    private String reviewedBy;

    private LocalDateTime reviewedAt;

    private Integer ocrAttemptCount = 0;

    private Integer riskScore = 0;

    private String encryptedPan;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public CustomerVerification() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getNameSimilarityPercentage() { return nameSimilarityPercentage; }
    public void setNameSimilarityPercentage(Double nameSimilarityPercentage) { this.nameSimilarityPercentage = nameSimilarityPercentage; }

    public boolean isNameMatchPassed() { return nameMatchPassed; }
    public void setNameMatchPassed(boolean nameMatchPassed) { this.nameMatchPassed = nameMatchPassed; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public Integer getOcrAttemptCount() { return ocrAttemptCount; }
    public void setOcrAttemptCount(Integer ocrAttemptCount) { this.ocrAttemptCount = ocrAttemptCount; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getEncryptedPan() { return encryptedPan; }
    public void setEncryptedPan(String encryptedPan) { this.encryptedPan = encryptedPan; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
