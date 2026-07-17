package com.scms.repository;

import com.scms.entity.WarehouseInsuranceClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseInsuranceClaimRepository extends JpaRepository<WarehouseInsuranceClaim, Integer> {
    List<WarehouseInsuranceClaim> findBySupplierId(int supplierId);
    List<WarehouseInsuranceClaim> findByWarehouseId(Integer warehouseId);
}
