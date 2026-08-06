package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_audits")
public class VerificationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long verificationId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String previousStatus;

    @Column(nullable = false)
    private String newStatus;

    private String actionBy;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private LocalDateTime createdAt = LocalDateTime.now();

    public VerificationAudit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVerificationId() { return verificationId; }
    public void setVerificationId(Long verificationId) { this.verificationId = verificationId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getActionBy() { return actionBy; }
    public void setActionBy(String actionBy) { this.actionBy = actionBy; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
