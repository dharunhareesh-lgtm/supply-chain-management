package com.scms.repository;

import com.scms.entity.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Integer> {
    List<ForecastResult> findByProductNameOrderByGeneratedAtDesc(String productName);
}
