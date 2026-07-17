package com.scms.repository;

import com.scms.entity.WarehousePartnerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehousePartnerRequestRepository extends JpaRepository<WarehousePartnerRequest, Integer> {
    List<WarehousePartnerRequest> findByWarehouseId(int warehouseId);
    List<WarehousePartnerRequest> findByLogisticsCompanyId(int logisticsCompanyId);
    Optional<WarehousePartnerRequest> findByWarehouseIdAndLogisticsCompanyId(int warehouseId, int logisticsCompanyId);
}
