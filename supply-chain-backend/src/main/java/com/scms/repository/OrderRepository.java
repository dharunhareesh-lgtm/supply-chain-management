package com.scms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.scms.entity.Order;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository
        extends JpaRepository<Order, Integer> {

    List<Order> findByCustomerName(String customerName);
    
    List<Order> findByStatus(String status);

    List<Order> findBySupplierId(Integer supplierId);

    List<Order> findBySupplierIdAndStatus(Integer supplierId, String status);

    List<Order> findByWarehouseId(Integer warehouseId);

    List<Order> findByWarehouseIdAndStatus(Integer warehouseId, String status);

    List<Order> findByLogisticsId(Integer logisticsId);

    List<Order> findByLogisticsIdAndStatus(Integer logisticsId, String status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.productName LIKE %:productName%")
    long countRecentOrders(@Param("productName") String productName);

    long countByStatusIgnoreCase(String status);

    long countByWarehouseId(Integer warehouseId);

    long countByWarehouseIdAndStatusIgnoreCase(Integer warehouseId, String status);
}