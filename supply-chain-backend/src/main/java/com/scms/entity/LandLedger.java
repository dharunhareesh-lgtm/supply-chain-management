package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "land_ledgers")
public class LandLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long landRecordId;

    private Double cumulativeSoldThisSeason = 0.0;

    private String lastVerifiedCrop;

    private LocalDateTime seasonResetDate = LocalDateTime.now();

    public LandLedger() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLandRecordId() { return landRecordId; }
    public void setLandRecordId(Long landRecordId) { this.landRecordId = landRecordId; }

    public Double getCumulativeSoldThisSeason() { return cumulativeSoldThisSeason; }
    public void setCumulativeSoldThisSeason(Double cumulativeSoldThisSeason) { this.cumulativeSoldThisSeason = cumulativeSoldThisSeason; }

    public String getLastVerifiedCrop() { return lastVerifiedCrop; }
    public void setLastVerifiedCrop(String lastVerifiedCrop) { this.lastVerifiedCrop = lastVerifiedCrop; }

    public LocalDateTime getSeasonResetDate() { return seasonResetDate; }
    public void setSeasonResetDate(LocalDateTime seasonResetDate) { this.seasonResetDate = seasonResetDate; }
}
