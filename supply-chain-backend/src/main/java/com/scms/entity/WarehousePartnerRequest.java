package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "warehouse_partner_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehousePartnerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int warehouseId;
    private int logisticsCompanyId;
    private String status; // PENDING, ACCEPTED, REJECTED
}
