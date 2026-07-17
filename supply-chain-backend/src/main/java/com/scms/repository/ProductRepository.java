package com.scms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.scms.entity.Product;

public interface ProductRepository
extends JpaRepository<Product, Integer> {

    List<Product> findBySupplierId(int supplierId);

    Product findByProductName(String productName);

    List<Product> findByWarehouseId(Integer warehouseId);

    List<Product> findByCategory(String category);

    List<Product> findByWarehouseIdAndCategory(Integer warehouseId, String category);

    @Query("SELECT DISTINCT p.productName FROM Product p WHERE p.status = 'APPROVED' AND (p.warehouseId IS NULL OR p.warehouseId IN (SELECT w.id FROM WarehouseLocation w WHERE w.status = 'ACTIVE'))")
    List<String> findApprovedProductNames();
}