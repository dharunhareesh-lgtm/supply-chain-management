package com.scms.repository;

import com.scms.entity.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, Integer> {
    Optional<WarehouseLocation> findByRegisteredEmail(String registeredEmail);
}
