package com.scms.repository;

import com.scms.entity.ForecastJobLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastJobLogRepository extends JpaRepository<ForecastJobLog, Long> {
    List<ForecastJobLog> findByCommodityAndStateAndMarketOrderByStartedAtDesc(
            String commodity, String state, String market);
            
    long countByStatus(String status);
}
