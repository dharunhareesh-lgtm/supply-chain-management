package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Settlement;
import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Integer> {
    List<Settlement> findBySupplierId(int supplierId);
    List<Settlement> findByWarehouseId(int warehouseId);
    List<Settlement> findByLogisticsId(int logisticsId);
    List<Settlement> findByOrderId(int orderId);
}
