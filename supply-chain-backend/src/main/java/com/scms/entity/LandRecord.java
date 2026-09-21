package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "land_records")
public class LandRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String surveyNumber;

    @Column(nullable = false)
    private String village;

    @Column(nullable = false)
    private String taluk;

    @Column(nullable = false)
    private String district;

    private String subDivision;

    private Double extentAcres;

    private String ownershipType; // OWNER, TENANT

    private Boolean isJointPatta = false;

    private String adangalCultivatorName;

    private String verificationStatus = "PENDING"; // PENDING, APPROVED, FLAGGED, REJECTED

    private LocalDateTime verifiedDate;

    private String leaseDocumentUrl;

    private String landownerPhone;

    private String callLog;

    private Double latitude;

    private Double longitude;

    private String photoUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public LandRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSurveyNumber() { return surveyNumber; }
    public void setSurveyNumber(String surveyNumber) { this.surveyNumber = surveyNumber; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getTaluk() { return taluk; }
    public void setTaluk(String taluk) { this.taluk = taluk; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getSubDivision() { return subDivision; }
    public void setSubDivision(String subDivision) { this.subDivision = subDivision; }

    public Double getExtentAcres() { return extentAcres; }
    public void setExtentAcres(Double extentAcres) { this.extentAcres = extentAcres; }

    public String getOwnershipType() { return ownershipType; }
    public void setOwnershipType(String ownershipType) { this.ownershipType = ownershipType; }

    public Boolean getIsJointPatta() { return isJointPatta; }
    public void setIsJointPatta(Boolean isJointPatta) { this.isJointPatta = isJointPatta; }

    public String getAdangalCultivatorName() { return adangalCultivatorName; }
    public void setAdangalCultivatorName(String adangalCultivatorName) { this.adangalCultivatorName = adangalCultivatorName; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public LocalDateTime getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; }

    public String getLeaseDocumentUrl() { return leaseDocumentUrl; }
    public void setLeaseDocumentUrl(String leaseDocumentUrl) { this.leaseDocumentUrl = leaseDocumentUrl; }

    public String getLandownerPhone() { return landownerPhone; }
    public void setLandownerPhone(String landownerPhone) { this.landownerPhone = landownerPhone; }

    public String getCallLog() { return callLog; }
    public void setCallLog(String callLog) { this.callLog = callLog; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
