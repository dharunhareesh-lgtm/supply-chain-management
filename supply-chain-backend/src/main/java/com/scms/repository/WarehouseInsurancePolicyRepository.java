package com.scms.repository;

import com.scms.entity.WarehouseInsurancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseInsurancePolicyRepository extends JpaRepository<WarehouseInsurancePolicy, Integer> {
    List<WarehouseInsurancePolicy> findByStatus(String status);
}
