package com.scms.repository;

import com.scms.entity.GovMarketObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GovMarketObservationRepository extends JpaRepository<GovMarketObservation, Long> {

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateIgnoreCase(@Param("commodity") String commodity, @Param("state") String state);

    @Query("SELECT g FROM GovMarketObservation g WHERE g.commodity = :commodity")
    List<GovMarketObservation> findByCommodityIgnoreCase(@Param("commodity") String commodity);

    @Query("SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END FROM GovMarketObservation g " +
           "WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district " +
           "AND g.market = :market AND g.variety = :variety AND g.marketDate = :marketDate")
    boolean existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety,
            @Param("marketDate") java.time.LocalDate marketDate);

    @Query("SELECT g.commodity, g.state, g.market, COUNT(g) FROM GovMarketObservation g GROUP BY g.commodity, g.state, g.market")
    List<Object[]> countObservationsGroupByCommodityStateMarket();

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g ORDER BY g.state")
    List<String> findDistinctStates();

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g WHERE g.commodity = :commodity ORDER BY g.state")
    List<String> findDistinctStatesByCommodity(@Param("commodity") String commodity);

    @Query("SELECT DISTINCT g.commodity FROM GovMarketObservation g ORDER BY g.commodity")
    List<String> findDistinctCommodities();

    @Query("SELECT DISTINCT g.district FROM GovMarketObservation g WHERE g.state = :state ORDER BY g.district")
    List<String> findDistinctDistrictsByState(@Param("state") String state);

    @Query("SELECT DISTINCT g.district FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state ORDER BY g.district")
    List<String> findDistinctDistrictsByCommodityAndState(
            @Param("commodity") String commodity,
            @Param("state") String state);

    @Query("SELECT DISTINCT g.market FROM GovMarketObservation g WHERE g.state = :state AND g.district = :district ORDER BY g.market")
    List<String> findDistinctMarketsByStateAndDistrict(@Param("state") String state, @Param("district") String district);

    @Query("SELECT DISTINCT g.market FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district ORDER BY g.market")
    List<String> findDistinctMarketsByCommodityAndStateAndDistrict(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district);

    @Query("SELECT DISTINCT g.variety FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district AND g.market = :market AND g.variety IS NOT NULL AND TRIM(g.variety) <> '' ORDER BY g.variety")
    List<String> findDistinctVarietiesByCommodityAndStateAndDistrictAndMarket(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);


    @Query("SELECT g FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district AND g.market = :market ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndDistrictAndMarketIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);


    @Query("SELECT g FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district AND g.market = :market AND g.variety = :variety ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndDistrictAndMarketAndVarietyIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety);


    @Query("SELECT g FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district AND g.market = :market ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateDistrictMarket(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE g.commodity = :commodity AND g.state = :state AND g.district = :district AND g.market = :market AND g.variety = :variety ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateDistrictMarketVariety(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district,
            @Param("market") String market,
            @Param("variety") String variety);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndMarketIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) AND LOWER(TRIM(g.variety)) = LOWER(TRIM(:variety)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findByCommodityAndStateAndMarketAndVarietyIgnoreCase(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("market") String market,
            @Param("variety") String variety);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateMarket(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) AND LOWER(TRIM(g.variety)) = LOWER(TRIM(:variety)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateMarketVariety(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("market") String market,
            @Param("variety") String variety);

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) AND g.state IS NOT NULL AND TRIM(g.state) <> ''")
    List<String> findDistinctStatesByCommodityAndMarketIgnoreCase(
            @Param("commodity") String commodity,
            @Param("market") String market);

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) AND LOWER(TRIM(g.variety)) = LOWER(TRIM(:variety)) AND g.state IS NOT NULL AND TRIM(g.state) <> ''")
    List<String> findDistinctStatesByCommodityAndMarketAndVarietyIgnoreCase(
            @Param("commodity") String commodity,
            @Param("market") String market,
            @Param("variety") String variety);

    @Query("SELECT DISTINCT g.state FROM GovMarketObservation g WHERE LOWER(TRIM(g.market)) = LOWER(TRIM(:market)) AND g.state IS NOT NULL AND TRIM(g.state) <> ''")
    List<String> findDistinctStatesByMarketIgnoreCase(@Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.market)) LIKE LOWER(CONCAT('%', TRIM(:market), '%')) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateMarketFuzzy(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("market") String market);

    @Query("SELECT g FROM GovMarketObservation g WHERE LOWER(TRIM(g.commodity)) = LOWER(TRIM(:commodity)) AND LOWER(TRIM(g.state)) = LOWER(TRIM(:state)) AND LOWER(TRIM(g.district)) = LOWER(TRIM(:district)) ORDER BY g.marketDate DESC")
    List<GovMarketObservation> findLatestByCommodityStateDistrict(
            @Param("commodity") String commodity,
            @Param("state") String state,
            @Param("district") String district);
}
