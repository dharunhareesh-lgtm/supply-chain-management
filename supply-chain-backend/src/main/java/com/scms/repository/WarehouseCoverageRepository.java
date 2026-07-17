package com.scms.repository;

import com.scms.entity.WarehouseCoverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarehouseCoverageRepository extends JpaRepository<WarehouseCoverage, Integer> {
    List<WarehouseCoverage> findByWarehouseId(int warehouseId);
    List<WarehouseCoverage> findByDistrict(String district);
    void deleteByWarehouseId(int warehouseId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT wc.district) FROM WarehouseCoverage wc")
    long countDistinctDistricts();
}
