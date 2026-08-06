package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_insurance_claims")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInsuranceClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private Integer warehouseId;

    private int supplierId;
    private String supplierName;
    private String warehouseName;
    private String productName;
    private String claimType; // Fire Damage, Flood Damage, Theft, Natural Disaster, Pest Infestation, Warehouse Structural Failure
    private double claimAmount;
    private String status = "SUBMITTED"; // SUBMITTED, VERIFIED, APPROVED, SETTLED
    private String description;
    private String submissionDate = java.time.LocalDate.now().toString();

    // File attachments & incident metadata
    private String photoName;
    
    @Column(columnDefinition = "LONGTEXT")
    private String photoPreview;
    
    private String docName;
    
    @Column(columnDefinition = "LONGTEXT")
    private String docPreview;
    
    private String incidentDate;
    private Integer lossPercent = 35;
}
