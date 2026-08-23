package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouse_model_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseModelMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modelVersion;
    private long trainingRecordCount;
    private long warehouseCount;
    private double validationScore;
    
    private String status; // NOT_READY, TRAINING, VALIDATED, ACTIVE, FAILED, RETIRED
    
    @Column(columnDefinition = "TEXT")
    private String coefficientsJson;
    
    private LocalDateTime lastTrainingDate;
}
