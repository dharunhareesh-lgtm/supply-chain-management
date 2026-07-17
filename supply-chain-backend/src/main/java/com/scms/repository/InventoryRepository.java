package com.scms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Inventory;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository
        extends JpaRepository<Inventory, Integer> {

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i WHERE i.productName = :productName")
    int getStockByProductName(@Param("productName") String productName);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i WHERE i.productName = :productName AND i.warehouseLocation LIKE %:region%")
    int getStockByProductNameAndRegion(@Param("productName") String productName, @Param("region") String region);

    Optional<Inventory> findByProductId(Integer productId);

    List<Inventory> findByWarehouseId(Integer warehouseId);
}