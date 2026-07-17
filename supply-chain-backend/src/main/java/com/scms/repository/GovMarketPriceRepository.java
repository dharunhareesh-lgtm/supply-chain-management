package com.scms.repository;

import com.scms.entity.GovMarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GovMarketPriceRepository extends JpaRepository<GovMarketPrice, Long> {

    @Query("SELECT g FROM GovMarketPrice g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.region) = LOWER(:region)")
    List<GovMarketPrice> findByCommodityAndRegionIgnoreCase(@Param("commodity") String commodity, @Param("region") String region);

    @Query("SELECT g FROM GovMarketPrice g WHERE LOWER(g.commodity) = LOWER(:commodity)")
    List<GovMarketPrice> findByCommodityIgnoreCase(@Param("commodity") String commodity);
}
