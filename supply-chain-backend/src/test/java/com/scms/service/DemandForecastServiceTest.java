package com.scms.service;

import com.scms.dto.DemandForecastDTO;
import com.scms.entity.DemandForecast;
import com.scms.entity.Order;
import com.scms.entity.Product;
import com.scms.repository.DemandForecastRepository;
import com.scms.repository.OrderRepository;
import com.scms.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DemandForecastServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DemandForecastRepository demandForecastRepository;

    @Mock
    private com.scms.repository.DemoDemandRecordRepository demoDemandRecordRepository;

    @InjectMocks
    private DemandForecastService demandForecastService;

    private Product toorDal;
    private Product wheat;
    private Product greenGram;

    @BeforeEach
    void setUp() {
        toorDal = new Product();
        toorDal.setProductId(101);
        toorDal.setProductName("Toor Dal");
        toorDal.setCategory("Pulses and Dals");
        toorDal.setStock(300);
        toorDal.setPrice(133.0);

        wheat = new Product();
        wheat.setProductId(102);
        wheat.setProductName("Wheat");
        wheat.setCategory("Cereals");
        wheat.setStock(1000);
        wheat.setPrice(32.0);

        greenGram = new Product();
        greenGram.setProductId(103);
        greenGram.setProductName("Green Gram");
        greenGram.setCategory("Pulses and Dals");
        greenGram.setStock(500);
        greenGram.setPrice(76.0);
    }

    @Test
    @DisplayName("1. Sufficient historical data generates Linear Regression forecast with genuine metrics")
    void testSufficientHistoricalDataForecast() {
        when(productRepository.findById(101)).thenReturn(Optional.of(toorDal));

        // 6 monthly orders: Jan 420, Feb 450, Mar 470, Apr 510, May 530, Jun 560
        List<Order> orders = new ArrayList<>();
        int[] quantities = {420, 450, 470, 510, 530, 560};
        String[] months = {"2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15", "2026-05-15", "2026-06-15"};

        for (int i = 0; i < quantities.length; i++) {
            Order o = new Order();
            o.setOrderId(i + 1);
            o.setProductId(101);
            o.setProductName("Toor Dal");
            o.setQuantity(quantities[i]);
            o.setOrderDate(months[i]);
            o.setStatus("Delivered");
            orders.add(o);
        }

        when(orderRepository.findByProductId(101)).thenReturn(orders);

        DemandForecastDTO result = demandForecastService.getDemandForecast(101, 30);

        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("Linear Regression", result.getModelName());
        assertEquals(6, result.getObservationCount());
        assertEquals(30, result.getSelectedHorizonDays());

        // Verify predictions exist and are positive
        assertNotNull(result.getForecast());
        assertTrue(result.getForecast().containsKey("7Days"));
        assertTrue(result.getForecast().containsKey("15Days"));
        assertTrue(result.getForecast().containsKey("30Days"));
        assertTrue(result.getForecast().containsKey("60Days"));

        Double pred30 = result.getForecast().get("30Days");
        assertTrue(pred30 > 500.0, "Projected demand for month 7 should be > 500 kg");
        assertEquals(pred30, result.getExpectedDemand());

        // Stock gap: current stock is 300, expected demand is ~588 kg -> gap is ~288 kg
        assertTrue(result.getStockGap() > 0);
        assertTrue(result.getRecommendation().contains("Recommended Restock:"));

        // Evaluation metrics must be present and valid
        assertNotNull(result.getMae());
        assertNotNull(result.getRmse());
        assertNotNull(result.getR2());
        assertTrue(result.getR2() > 0.90, "R2 for linear trend should be high");

        // Verify history was saved to audit repository
        verify(demandForecastRepository, atLeast(1)).save(any(DemandForecast.class));
    }

    @Test
    @DisplayName("2. Insufficient historical data (< 3 months) returns INSUFFICIENT_DATA and no fabricated forecasts")
    void testInsufficientHistoricalData() {
        when(productRepository.findById(102)).thenReturn(Optional.of(wheat));

        List<Order> orders = new ArrayList<>();
        Order o = new Order();
        o.setOrderId(1);
        o.setProductId(102);
        o.setProductName("Wheat");
        o.setQuantity(200);
        o.setOrderDate("2026-06-10");
        o.setStatus("Delivered");
        orders.add(o);

        when(orderRepository.findByProductId(102)).thenReturn(orders);

        DemandForecastDTO result = demandForecastService.getDemandForecast(102, 30);

        assertNotNull(result);
        assertEquals("INSUFFICIENT_DATA", result.getStatus());
        assertTrue(result.getMessage().contains("Not enough historical data"));
        assertEquals(1, result.getObservationCount());
        assertTrue(result.getForecast().isEmpty(), "No fake forecast should be generated");
        assertNull(result.getMae());
        assertNull(result.getR2());
    }

    @Test
    @DisplayName("3. Product with zero orders returns NO_DATA")
    void testNoHistoricalOrders() {
        when(productRepository.findById(103)).thenReturn(Optional.of(greenGram));
        when(orderRepository.findByProductId(103)).thenReturn(new ArrayList<>());

        DemandForecastDTO result = demandForecastService.getDemandForecast(103, 15);

        assertNotNull(result);
        assertEquals("NO_DATA", result.getStatus());
        assertTrue(result.getMessage().contains("No historical transaction data"));
        assertEquals(0, result.getObservationCount());
        assertTrue(result.getHistoricalDemand().isEmpty());
    }

    @Test
    @DisplayName("4. Non-existent product ID returns ERROR")
    void testProductNotFound() {
        when(productRepository.findById(999)).thenReturn(Optional.empty());

        DemandForecastDTO result = demandForecastService.getDemandForecast(999, 7);

        assertNotNull(result);
        assertEquals("ERROR", result.getStatus());
        assertTrue(result.getMessage().contains("Product not found"));
    }

    @Test
    @DisplayName("5. Stock gap is zero and recommendation indicates sufficiency when stock exceeds forecast")
    void testStockSufficientScenario() {
        // Give Toor Dal 2000 kg stock
        toorDal.setStock(2000);
        when(productRepository.findById(101)).thenReturn(Optional.of(toorDal));

        List<Order> orders = new ArrayList<>();
        int[] quantities = {300, 310, 320};
        String[] months = {"2026-01-15", "2026-02-15", "2026-03-15"};
        for (int i = 0; i < quantities.length; i++) {
            Order o = new Order();
            o.setOrderId(i + 1);
            o.setProductId(101);
            o.setQuantity(quantities[i]);
            o.setOrderDate(months[i]);
            orders.add(o);
        }
        when(orderRepository.findByProductId(101)).thenReturn(orders);

        DemandForecastDTO result = demandForecastService.getDemandForecast(101, 30);

        assertEquals("SUCCESS", result.getStatus());
        assertEquals(0.0, result.getStockGap());
        assertEquals("Current stock is sufficient for forecasted demand.", result.getRecommendation());
    }

    @Test
    @DisplayName("6. Forecast horizons 7, 15, 30, and 60 days behave properly")
    void testHorizons() {
        when(productRepository.findById(101)).thenReturn(Optional.of(toorDal));

        List<Order> orders = new ArrayList<>();
        int[] quantities = {400, 420, 440, 460};
        String[] months = {"2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15"};
        for (int i = 0; i < quantities.length; i++) {
            Order o = new Order();
            o.setOrderId(i + 1);
            o.setProductId(101);
            o.setQuantity(quantities[i]);
            o.setOrderDate(months[i]);
            orders.add(o);
        }
        when(orderRepository.findByProductId(101)).thenReturn(orders);

        DemandForecastDTO res7 = demandForecastService.getDemandForecast(101, 7);
        assertEquals(7, res7.getSelectedHorizonDays());
        assertEquals(res7.getForecast().get("7Days"), res7.getExpectedDemand());

        DemandForecastDTO res60 = demandForecastService.getDemandForecast(101, 60);
        assertEquals(60, res60.getSelectedHorizonDays());
        assertEquals(res60.getForecast().get("60Days"), res60.getExpectedDemand());
        assertTrue(res60.getExpectedDemand() > res7.getExpectedDemand());
    }

    @Test
    @DisplayName("7. DEMO mode uses exactly 3 isolated demo records and generates valid Linear Regression forecasts")
    void testDemoModeForecastWith3IsolatedPeriods() {
        when(productRepository.findById(101)).thenReturn(Optional.of(toorDal));

        // 3 isolated demo records: July (2220 kg), August (1430 kg), September (1800 kg)
        List<com.scms.entity.DemoDemandRecord> demoRecords = List.of(
                com.scms.entity.DemoDemandRecord.builder()
                        .productId(101)
                        .productName("Toor Dal")
                        .period("2026-07")
                        .quantity(2220.0)
                        .isDemo(true)
                        .build(),
                com.scms.entity.DemoDemandRecord.builder()
                        .productId(101)
                        .productName("Toor Dal")
                        .period("2026-08")
                        .quantity(1430.0)
                        .isDemo(true)
                        .build(),
                com.scms.entity.DemoDemandRecord.builder()
                        .productId(101)
                        .productName("Toor Dal")
                        .period("2026-09")
                        .quantity(1800.0)
                        .isDemo(true)
                        .build()
        );

        when(demoDemandRecordRepository.findByProductIdOrderByPeriodAsc(101)).thenReturn(demoRecords);

        DemandForecastDTO result = demandForecastService.getDemandForecast(101, 30, "DEMO");

        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("DEMO", result.getMode());
        assertTrue(result.getDemoMode());
        assertEquals(3, result.getObservationCount());

        // Verify all 4 horizons are calculated
        assertNotNull(result.getForecast());
        assertTrue(result.getForecast().containsKey("7Days"));
        assertTrue(result.getForecast().containsKey("15Days"));
        assertTrue(result.getForecast().containsKey("30Days"));
        assertTrue(result.getForecast().containsKey("60Days"));

        // Evaluation metrics must be present and valid for 3 data points
        assertNotNull(result.getMae());
        assertNotNull(result.getRmse());
        assertNotNull(result.getR2());

        // Historical series has exactly the 3 demo months
        assertEquals(3, result.getHistoricalDemand().size());
        assertEquals("2026-07", result.getHistoricalDemand().get(0).getDate());
        assertEquals(2220.0, result.getHistoricalDemand().get(0).getQuantity());
        assertEquals("2026-08", result.getHistoricalDemand().get(1).getDate());
        assertEquals(1430.0, result.getHistoricalDemand().get(1).getQuantity());
        assertEquals("2026-09", result.getHistoricalDemand().get(2).getDate());
        assertEquals(1800.0, result.getHistoricalDemand().get(2).getQuantity());

        // Real orders repository must NOT have been called
        verify(orderRepository, never()).findByProductId(101);
    }

    @Test
    @DisplayName("8. REAL mode strictly queries authentic orders and returns INSUFFICIENT_DATA when < 3 months exist")
    void testRealModeEnforcesAuthenticDataOnly() {
        when(productRepository.findById(101)).thenReturn(Optional.of(toorDal));

        // Authentic orders in DB: Only 2 months (July and August)
        List<Order> realOrders = new ArrayList<>();
        Order o1 = new Order();
        o1.setOrderId(21);
        o1.setProductId(101);
        o1.setProductName("Toor Dal");
        o1.setQuantity(2220);
        o1.setOrderDate("2026-07-15");
        realOrders.add(o1);

        Order o2 = new Order();
        o2.setOrderId(28);
        o2.setProductId(101);
        o2.setProductName("Toor Dal");
        o2.setQuantity(1430);
        o2.setOrderDate("2026-08-08");
        realOrders.add(o2);

        when(orderRepository.findByProductId(101)).thenReturn(realOrders);

        DemandForecastDTO result = demandForecastService.getDemandForecast(101, 30, "REAL");

        assertNotNull(result);
        assertEquals("INSUFFICIENT_DATA", result.getStatus());
        assertEquals("REAL", result.getMode());
        assertFalse(result.getDemoMode());
        assertEquals(2, result.getObservationCount());
        assertTrue(result.getForecast().isEmpty());
        assertNull(result.getMae());
        assertNull(result.getR2());

        // Demo repository must NOT have been queried in REAL mode
        verify(demoDemandRecordRepository, never()).findByProductIdOrderByPeriodAsc(101);
    }
}
