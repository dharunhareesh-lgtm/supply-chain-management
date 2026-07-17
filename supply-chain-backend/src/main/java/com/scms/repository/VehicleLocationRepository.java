package com.scms.repository;

import com.scms.entity.VehicleLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleLocationRepository extends JpaRepository<VehicleLocation, Integer> {
    List<VehicleLocation> findByLogisticsCompanyId(int logisticsCompanyId);
    Optional<VehicleLocation> findByVehicleId(int vehicleId);
}
