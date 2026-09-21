package com.scms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "supplier_land_records")
public class SupplierLandRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int supplierId;

    private Long landRecordId;

    public SupplierLandRecord() {}

    public SupplierLandRecord(int supplierId, Long landRecordId) {
        this.supplierId = supplierId;
        this.landRecordId = landRecordId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getSupplierId() { return supplierId; }
    public void setSupplierId(int supplierId) { this.supplierId = supplierId; }

    public Long getLandRecordId() { return landRecordId; }
    public void setLandRecordId(Long landRecordId) { this.landRecordId = landRecordId; }
}
