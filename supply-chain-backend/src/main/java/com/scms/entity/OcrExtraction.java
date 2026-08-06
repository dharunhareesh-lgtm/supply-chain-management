package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ocr_extractions")
public class OcrExtraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long verificationId;

    private String extractedName;

    private String extractedDocumentNumber;

    private String extractedDob;

    @Column(columnDefinition = "TEXT")
    private String extractedAddress;

    @Column(columnDefinition = "LONGTEXT")
    private String rawExtractedText;

    private String documentType;

    private boolean formatValid;

    private Double confidenceScore;

    private LocalDateTime createdAt = LocalDateTime.now();

    public OcrExtraction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVerificationId() { return verificationId; }
    public void setVerificationId(Long verificationId) { this.verificationId = verificationId; }

    public String getExtractedName() { return extractedName; }
    public void setExtractedName(String extractedName) { this.extractedName = extractedName; }

    public String getExtractedDocumentNumber() { return extractedDocumentNumber; }
    public void setExtractedDocumentNumber(String extractedDocumentNumber) { this.extractedDocumentNumber = extractedDocumentNumber; }

    public String getExtractedDob() { return extractedDob; }
    public void setExtractedDob(String extractedDob) { this.extractedDob = extractedDob; }

    public String getExtractedAddress() { return extractedAddress; }
    public void setExtractedAddress(String extractedAddress) { this.extractedAddress = extractedAddress; }

    public String getRawExtractedText() { return rawExtractedText; }
    public void setRawExtractedText(String rawExtractedText) { this.rawExtractedText = rawExtractedText; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public boolean isFormatValid() { return formatValid; }
    public void setFormatValid(boolean formatValid) { this.formatValid = formatValid; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
