package com.scms.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.CategoryCapacity;
import com.scms.repository.CategoryCapacityRepository;

@Service
public class CategoryCapacityService {

    @Autowired
    private CategoryCapacityRepository categoryCapacityRepository;

    public List<CategoryCapacity> getAllCapacities() {
        return categoryCapacityRepository.findAll();
    }

    public List<CategoryCapacity> getCapacities(Integer warehouseId) {
        List<CategoryCapacity> list = categoryCapacityRepository.findAll();
        if (warehouseId != null) {
            List<CategoryCapacity> filtered = list.stream()
                .filter(c -> c.getWarehouseId() != null && c.getWarehouseId().equals(warehouseId))
                .collect(Collectors.toList());
            
            if (filtered.isEmpty()) {
                // Initialize default capacities for the warehouse (Pulses, Grains, etc.)
                List<String> categories = List.of("Pulses and Dals", "Grains", "Cereals", "Spices", "Dry Fruits", "Oil Seeds");
                for (String cat : categories) {
                    CategoryCapacity cc = new CategoryCapacity();
                    cc.setCategory(cat);
                    cc.setWarehouseId(warehouseId);
                    cc.setMaxCapacity(10000); // default max capacity
                    cc.setUsedCapacity(0);
                    categoryCapacityRepository.save(cc);
                }
                // re-fetch
                list = categoryCapacityRepository.findAll();
                filtered = list.stream()
                    .filter(c -> c.getWarehouseId() != null && c.getWarehouseId().equals(warehouseId))
                    .collect(Collectors.toList());
            }
            return filtered;
        }
        return list;
    }

    public CategoryCapacity getCapacityById(int id) {
        return categoryCapacityRepository
                .findById(id)
                .orElse(null);
    }

    public CategoryCapacity addCapacity(
            CategoryCapacity capacity) {

        return categoryCapacityRepository
                .save(capacity);
    }

    public CategoryCapacity updateCapacity(
            CategoryCapacity capacity) {

        return categoryCapacityRepository
                .save(capacity);
    }

    public void deleteCapacity(int id) {

        categoryCapacityRepository
                .deleteById(id);
    }
}