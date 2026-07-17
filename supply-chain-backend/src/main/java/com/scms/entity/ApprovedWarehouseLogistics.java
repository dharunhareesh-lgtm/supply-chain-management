package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "approved_warehouse_logistics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApprovedWarehouseLogistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int warehouseId;
    private int logisticsCompanyId;
}
