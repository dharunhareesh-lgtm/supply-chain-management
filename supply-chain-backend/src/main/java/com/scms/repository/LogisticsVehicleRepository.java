package com.scms.repository;

import com.scms.entity.LogisticsVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LogisticsVehicleRepository extends JpaRepository<LogisticsVehicle, Integer> {
    List<LogisticsVehicle> findByCompanyName(String companyName);
    List<LogisticsVehicle> findByIsAvailable(boolean isAvailable);
    long countByStatusIgnoreCase(String status);
}
