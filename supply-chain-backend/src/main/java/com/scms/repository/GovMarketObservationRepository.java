package com.scms.repository;

import com.scms.entity.GovMarketObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GovMarketObservationRepository extends JpaRepository<GovMarketObservation, Long> {

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state)")
    List<GovMarketObservation> findByCommodityAndStateIgnoreCase(@Param("commodity") String commodity, @Param("state") String state);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity)")
    List<GovMarketObservation> findByCommodityIgnoreCase(@Param("commodity") String commodity);

    boolean existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
            String commodity, String state, String district, String market, String variety, java.time.LocalDate marketDate);

    @Query("SELECT g.commodity, g.state, g.market, COUNT(g) FROM GovMarketObservation g GROUP BY g.commodity, g.state, g.market")
    List<Object[]> countObservationsGroupByCommodityStateMarket();

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g ORDER BY g.state")
    List<String> findDistinctStates();

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) ORDER BY g.state")
    List<String> findDistinctStatesByCommodity(@Param("commodity") String commodity);

    @Query("SELECT DISTINCT g.commodity FROM GovMarketObservation g ORDER BY g.commodity")
    List<String> findDistinctCommodities();

    @Query("SELECT DISTINCT g.district FROM GovMarketObservation g WHERE LOWER(g.state) = LOWER(:state) ORDER BY g.district")
    List<String> findDistinctDistrictsByState(@Param("state") String state);

    @Query("SELECT DISTINCT g.district FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) ORDER BY g.district")
    List<String> findDistinctDistrictsByCommodityAndState(
            @Param("commodity") String commodity,
            @Param("state") String state);

    @Query("SELECT DISTINCT g.market FROM GovMarketObservation g WHERE LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) ORDER BY g.market")
    List<String> findDistinctMarketsByStateAndDistrict(@Param("state") String state, @Param("district") String district);

    @Query("SELECT DISTINCT g.market FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) ORDER BY g.market")
    List<String> findDistinctMarketsByCommodityAndStateAndDistrict(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district);

    @Query("SELECT DISTINCT g.variety FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) AND LOWER(g.market) = LOWER(:market) AND g.variety IS NOT NULL AND TRIM(g.variety) <> '' ORDER BY g.variety")
    List<String> findDistinctVarietiesByCommodityAndStateAndDistrictAndMarket(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);


    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) AND LOWER(g.market) = LOWER(:market) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);


    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) AND LOWER(g.market) = LOWER(:market) AND LOWER(g.variety) = LOWER(:variety) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety);


    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) AND LOWER(g.market) = LOWER(:market) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateDistrictMarket(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(g.commodity) = LOWER(:commodity) AND LOWER(g.state) = LOWER(:state) AND LOWER(g.district) = LOWER(:district) AND LOWER(g.market) = LOWER(:market) AND LOWER(g.variety) = LOWER(:variety) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateDistrictMarketVariety(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety);
}





