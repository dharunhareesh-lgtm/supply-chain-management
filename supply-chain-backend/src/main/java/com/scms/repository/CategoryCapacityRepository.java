package com.scms.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.CategoryCapacity;

public interface CategoryCapacityRepository
        extends JpaRepository<CategoryCapacity, Integer> {

    List<CategoryCapacity> findByWarehouseId(Integer warehouseId);
    java.util.Optional<CategoryCapacity> findByWarehouseIdAndCategory(Integer warehouseId, String category);
}