package com.scms.repository;

import com.scms.entity.ApprovedWarehouseLogistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovedWarehouseLogisticsRepository extends JpaRepository<ApprovedWarehouseLogistics, Integer> {
    List<ApprovedWarehouseLogistics> findByWarehouseId(int warehouseId);
    List<ApprovedWarehouseLogistics> findByLogisticsCompanyId(int logisticsCompanyId);
    Optional<ApprovedWarehouseLogistics> findByWarehouseIdAndLogisticsCompanyId(int warehouseId, int logisticsCompanyId);
    void deleteByWarehouseIdAndLogisticsCompanyId(int warehouseId, int logisticsCompanyId);
}
