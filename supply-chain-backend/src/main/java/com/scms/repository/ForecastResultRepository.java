package com.scms.repository;

import com.scms.entity.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Integer> {
    List<ForecastResult> findByProductNameOrderByGeneratedAtDesc(String productName);

    @Query("SELECT f FROM ForecastResult f WHERE f.productName = :productName " +
            "AND f.state = :state " +
            "AND (:district IS NULL OR :district = '' OR f.district = :district) " +
            "AND f.market = :market " +
            "AND (:variety IS NULL OR :variety = '' OR f.variety = :variety OR f.variety = '') " +
            "ORDER BY f.generatedAt DESC")
    List<ForecastResult> findLatestForecast(
            @Param("productName") String productName,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety);
}
