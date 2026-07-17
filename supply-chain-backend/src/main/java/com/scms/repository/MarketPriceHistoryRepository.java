package com.scms.repository;

import com.scms.entity.MarketPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketPriceHistoryRepository extends JpaRepository<MarketPriceHistory, Integer> {
    List<MarketPriceHistory> findByProductNameOrderByRecordedDateDesc(String productName);
}
