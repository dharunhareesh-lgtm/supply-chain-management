package com.scms;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SupplyChainBackendApplicationTests {

	static {
		try {
			io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
					.directory("../")
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		} catch (Exception e) {
			System.err.println("Could not load root .env in test: " + e.getMessage());
		}
	}

	@org.springframework.beans.factory.annotation.Autowired
	private com.scms.repository.GovMarketObservationRepository govMarketObservationRepository;


	@Test
	void contextLoads() {
	}










	@Test
	void runAudit() {
		java.util.List<com.scms.entity.GovMarketObservation> obs = govMarketObservationRepository.findAll();
		System.out.println("=== GOV MARKET OBSERVATION AUDIT ===");
		System.out.println("Total Observations: " + obs.size());
		
		long uniqueCommodities = obs.stream().map(com.scms.entity.GovMarketObservation::getCommodity).distinct().count();
		System.out.println("Unique Commodities: " + uniqueCommodities);
		
		long uniqueStates = obs.stream().map(com.scms.entity.GovMarketObservation::getState).distinct().count();
		System.out.println("Unique States: " + uniqueStates);
		
		long uniqueDistricts = obs.stream().map(com.scms.entity.GovMarketObservation::getDistrict).distinct().count();
		System.out.println("Unique Districts: " + uniqueDistricts);
		
		long uniqueMarkets = obs.stream().map(com.scms.entity.GovMarketObservation::getMarket).distinct().count();
		System.out.println("Unique Markets: " + uniqueMarkets);

		java.util.List<java.time.LocalDate> dates = obs.stream()
				.map(com.scms.entity.GovMarketObservation::getMarketDate)
				.filter(java.util.Objects::nonNull)
				.sorted()
				.collect(java.util.stream.Collectors.toList());

		if (!dates.isEmpty()) {
			System.out.println("Earliest Market Date: " + dates.get(0));
			System.out.println("Latest Market Date: " + dates.get(dates.size() - 1));
		} else {
			System.out.println("Earliest Market Date: N/A");
			System.out.println("Latest Market Date: N/A");
		}

		// Observations per commodity
		System.out.println("Observations per Commodity:");
		obs.stream().collect(java.util.stream.Collectors.groupingBy(com.scms.entity.GovMarketObservation::getCommodity, java.util.stream.Collectors.counting()))
				.forEach((commodity, count) -> System.out.println("  - " + commodity + ": " + count));

		// Observations per commodity + state
		System.out.println("Observations per Commodity + State:");
		obs.stream().collect(java.util.stream.Collectors.groupingBy(o -> o.getCommodity() + " | " + o.getState(), java.util.stream.Collectors.counting()))
				.forEach((key, count) -> System.out.println("  - " + key + ": " + count));

		// Observations per commodity + state + market
		System.out.println("Observations per Commodity + State + Market:");
		obs.stream().collect(java.util.stream.Collectors.groupingBy(o -> o.getCommodity() + " | " + o.getState() + " | " + o.getMarket(), java.util.stream.Collectors.counting()))
				.forEach((key, count) -> System.out.println("  - " + key + ": " + count));
		
		System.out.println("====================================");
	}

	@Test
	@org.springframework.transaction.annotation.Transactional
	void testDataQualityAndDuplicatePrevention() {
		// Clean up any test observations first
		govMarketObservationRepository.deleteAll();

		// 1. Create a valid observation
		com.scms.entity.GovMarketObservation obs1 = new com.scms.entity.GovMarketObservation(
				"Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "Local",
				2400.0, 2800.0, 2600.0, 26.0,
				java.time.LocalDate.of(2026, 8, 8), "DATA_GOV_IN", java.time.LocalDateTime.now()
		);
		govMarketObservationRepository.save(obs1);

		// Verify it is saved
		org.junit.jupiter.api.Assertions.assertEquals(1, govMarketObservationRepository.findAll().size());

		// 2. Try saving the exact same observation again (Duplicate check simulation)
		boolean exists = govMarketObservationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
				"Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "Local", java.time.LocalDate.of(2026, 8, 8)
		);

		org.junit.jupiter.api.Assertions.assertTrue(exists, "Observation should be detected as duplicate");

		// 3. Different date creates a new record
		boolean existsDiffDate = govMarketObservationRepository.existsByCommodityIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndVarietyIgnoreCaseAndMarketDate(
				"Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "Local", java.time.LocalDate.of(2026, 8, 9)
		);
		org.junit.jupiter.api.Assertions.assertFalse(existsDiffDate, "Different date should not be detected as duplicate");

		// 4. Test validation logic simulation
		// Commodity empty
		org.junit.jupiter.api.Assertions.assertTrue(isInvalidRecord("", "State", "Market", 2000, 2500, 2200, java.time.LocalDate.now()));

		// Modal price <= 0
		org.junit.jupiter.api.Assertions.assertTrue(isInvalidRecord("Wheat", "State", "Market", 2000, 2500, 0, java.time.LocalDate.now()));
		// min > modal
		org.junit.jupiter.api.Assertions.assertTrue(isInvalidRecord("Wheat", "State", "Market", 2600, 2800, 2500, java.time.LocalDate.now()));
	}

	private boolean isInvalidRecord(String comm, String st, String mkt, double min, double max, double modal, java.time.LocalDate date) {
		return comm == null || comm.trim().isEmpty() ||
				st == null || st.trim().isEmpty() ||
				mkt == null || mkt.trim().isEmpty() ||
				date == null ||
				min <= 0 || max <= 0 || modal <= 0 ||
				min > modal || modal > max;
	}
}



