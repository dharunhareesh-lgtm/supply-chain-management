package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trust_score_histories")
public class TrustScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String eventType; // SUCCESSFUL_ORDER, ONLINE_PAYMENT, CUSTOMER_VERIFIED, POSITIVE_REVIEW, FAKE_ORDER, FRAUD_REPORT, COD_REJECTION

    private int scoreChange;

    private int previousScore;

    private int newScore;

    private String description;

    private LocalDateTime createdAt = LocalDateTime.now();

    public TrustScoreHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public int getScoreChange() { return scoreChange; }
    public void setScoreChange(int scoreChange) { this.scoreChange = scoreChange; }

    public int getPreviousScore() { return previousScore; }
    public void setPreviousScore(int previousScore) { this.previousScore = previousScore; }

    public int getNewScore() { return newScore; }
    public void setNewScore(int newScore) { this.newScore = newScore; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
