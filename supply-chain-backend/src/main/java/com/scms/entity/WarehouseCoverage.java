package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_coverage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseCoverage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int warehouseId;
    private String district;
}
