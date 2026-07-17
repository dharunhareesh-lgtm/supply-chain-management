package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_insurance_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInsurancePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String policyName;
    private double coveragePercentage;
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}
