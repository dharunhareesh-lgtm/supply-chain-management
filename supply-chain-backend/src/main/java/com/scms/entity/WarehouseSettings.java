package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String warehouseName;
    private Double latitude;
    private Double longitude;
}