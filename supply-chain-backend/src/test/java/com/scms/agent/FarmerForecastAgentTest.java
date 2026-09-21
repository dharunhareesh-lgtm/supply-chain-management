package com.scms.agent;

import com.scms.dto.ForecastRequest;
import com.scms.dto.ForecastResponse;
import com.scms.service.ForecastService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class FarmerForecastAgentTest {

    @Mock
    private ForecastService forecastService;

    @InjectMocks
    private FarmerActionExecutor actionExecutor;

    private FarmerResponseFormatter responseFormatter;
    private FarmerIntentResolver intentResolver;
    private FarmerContext dummyContext;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        responseFormatter = new FarmerResponseFormatter();
        intentResolver = new FarmerIntentResolver();

        ReflectionTestUtils.setField(actionExecutor, "responseFormatter", responseFormatter);
        ReflectionTestUtils.setField(actionExecutor, "forecastService", forecastService);

        dummyContext = new FarmerContext();
        dummyContext.setSupplierId(101);
        dummyContext.setUsername("Muthu");
        dummyContext.setPreferredLanguage("ta");
    }

    @Test
    public void testForecastWithoutCropClarification() {
        // Requirement 1: Click Tamil "முன்னறிவிப்பு" -> request must NOT contain Tomato -> asks which crop
        IntentResolution resTa = intentResolver.resolveIntent("விலை கணிப்பு காட்டு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, resTa.getAction());
        assertTrue(resTa.isClarificationNeeded());
        assertEquals("எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?", resTa.getClarificationPrompt());
        assertNull(resTa.getResolvedCrop());

        ActionResult actionResult = actionExecutor.execute(resTa, dummyContext);
        assertEquals(ActionType.CLARIFICATION_NEEDED, actionResult.getAction());
        assertEquals("எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?", actionResult.getUserMessage());

        // Requirement 2: Click English "Forecast" -> same behavior
        dummyContext.setPreferredLanguage("en");
        IntentResolution resEn = intentResolver.resolveIntent("show price forecast", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, resEn.getAction());
        assertTrue(resEn.isClarificationNeeded());
        assertEquals("Which crop would you like a price forecast for?", resEn.getClarificationPrompt());
        assertNull(resEn.getResolvedCrop());
    }

    @Test
    public void testForecastExplicitTomato() {
        // Requirement 3: "tomato price forecast சொல்லு" -> Tomato forecast action
        IntentResolution res = intentResolver.resolveIntent("tomato price forecast சொல்லு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertFalse(res.isClarificationNeeded());
        assertEquals("Tomato", res.getResolvedCrop());

        // Requirement 4: Explicit Tamil tomato forecast -> "தக்காளி விலை கணிப்பு சொல்லு"
        IntentResolution resTa = intentResolver.resolveIntent("தக்காளி விலை கணிப்பு சொல்லு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, resTa.getAction());
        assertFalse(resTa.isClarificationNeeded());
        assertEquals("Tomato", resTa.getResolvedCrop());
    }

    @Test
    public void testForecastWithSelectedCropInContext() {
        // Requirement 5: Selected crop exists -> use selected crop instead of Tomato
        dummyContext.setSelectedCrop("Toor Dal");
        IntentResolution res = intentResolver.resolveIntent("விலை கணிப்பு காட்டு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertFalse(res.isClarificationNeeded());
        assertEquals("Toor Dal", res.getResolvedCrop());
    }

    @Test
    public void testInsufficientHistoricalDataNeverDisplaysZero() {
        // Requirement 6: Insufficient historical data -> NEVER ₹0.0/kg, returns localized message
        ForecastResponse insufficientRes = new ForecastResponse();
        insufficientRes.setProductName("Tomato");
        insufficientRes.setForecastStatus("INSUFFICIENT_HISTORICAL_DATA");
        insufficientRes.setPredicted7Days(null);
        insufficientRes.setPredicted15Days(null);
        insufficientRes.setPredicted30Days(null);
        insufficientRes.setReason("Insufficient historical data: Only 6 valid daily price observations available. Minimum 35 valid distinct dates required for forecasting.");

        when(forecastService.getForecast(any(ForecastRequest.class))).thenReturn(insufficientRes);

        IntentResolution res = intentResolver.resolveIntent("tomato price forecast சொல்லு", dummyContext, null);
        ActionResult actionResult = actionExecutor.execute(res, dummyContext);

        String msgTa = actionResult.getUserMessage();
        assertFalse(msgTa.contains("₹0.0"));
        assertFalse(msgTa.contains("₹0/"));
        assertTrue(msgTa.contains("போதுமான வரலாற்றுத் தரவுகள் இல்லை"));

        // English test
        String msgEn = responseFormatter.formatForecast("en", insufficientRes);
        assertFalse(msgEn.contains("₹0.0"));
        assertFalse(msgEn.contains("₹0/"));
        assertTrue(msgEn.contains("Not enough historical market data is available"));
    }

    @Test
    public void testValidMLForecastDisplaysValuesCorrectly() {
        // Requirement 7: Valid ML forecast -> existing predicted values still display correctly
        ForecastResponse validRes = new ForecastResponse();
        validRes.setProductName("Tomato");
        validRes.setForecastStatus("ML_READY");
        validRes.setPredicted7Days(42.5);
        validRes.setPredicted15Days(45.0);
        validRes.setPredicted30Days(48.2);
        validRes.setPredicted60Days(50.0);
        validRes.setTrend("UPWARD");
        validRes.setConfidenceScore(88.0);

        String msgTa = responseFormatter.formatForecast("ta", validRes);
        assertTrue(msgTa.contains("₹42.5/kg"));
        assertTrue(msgTa.contains("₹45.0/kg"));
        assertTrue(msgTa.contains("₹48.2/kg"));
        assertTrue(msgTa.contains("உயரும் (ஏற்றம்)"));

        String msgEn = responseFormatter.formatForecast("en", validRes);
        assertTrue(msgEn.contains("₹42.5/kg"));
        assertTrue(msgEn.contains("₹45.0/kg"));
        assertTrue(msgEn.contains("₹48.2/kg"));
        assertTrue(msgEn.contains("UPWARD"));
    }

    @Test
    public void testForecastFollowUpTurnResolvesRiceAndExecutes() {
        // Test: Generic request -> clarification; Follow-up "Rice" with history -> RUN_PRICE_FORECAST (Rice)
        List<Map<String, String>> history = new ArrayList<>();
        history.add(Map.of("role", "assistant", "content", "வணக்கம்! நான் உங்கள் DRAVIX விவசாய உதவியாளர்."));
        history.add(Map.of("role", "user", "content", "விலை கணிப்பு காட்டு"));
        history.add(Map.of("role", "assistant", "content", "எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?"));

        IntentResolution res = intentResolver.resolveIntent("Rice", dummyContext, history);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertFalse(res.isClarificationNeeded());
        assertEquals("Rice", res.getResolvedCrop());

        ForecastResponse mockRiceForecast = new ForecastResponse();
        mockRiceForecast.setProductName("Rice");
        mockRiceForecast.setForecastStatus("ML_READY");
        mockRiceForecast.setPredicted7Days(40.1);
        mockRiceForecast.setPredicted15Days(40.1);
        mockRiceForecast.setPredicted30Days(42.5);
        mockRiceForecast.setTrend("UPWARD");

        when(forecastService.getForecast(any(ForecastRequest.class))).thenReturn(mockRiceForecast);

        ActionResult actionResult = actionExecutor.execute(res, dummyContext);
        assertEquals(ActionType.RUN_PRICE_FORECAST, actionResult.getAction());
        assertTrue(actionResult.getUserMessage().contains("Rice"));
        assertTrue(actionResult.getUserMessage().contains("₹40.1/kg"));
        assertTrue(actionResult.getUserMessage().contains("₹42.5/kg"));
    }

    @Test
    public void testForecastEnrichesFromContextMarketAndDistrict() {
        dummyContext.setSelectedMarket("Viruthachalam(Uzhavar Sandhai )");
        dummyContext.setSelectedDistrict("Cuddalore");
        dummyContext.setSelectedVariety("Red Nanital");

        IntentResolution res = intentResolver.resolveIntent("Rice price forecast சொல்லு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertEquals("Rice", res.getResolvedCrop());

        ForecastResponse mockRes = new ForecastResponse();
        mockRes.setProductName("Rice");
        mockRes.setForecastStatus("ML_READY");
        mockRes.setPredicted7Days(40.1);
        when(forecastService.getForecast(argThat(r ->
            "Rice".equals(r.getProductName()) &&
            "Viruthachalam(Uzhavar Sandhai )".equals(r.getMarket()) &&
            "Cuddalore".equals(r.getDistrict()) &&
            "Red Nanital".equals(r.getVariety())
        ))).thenReturn(mockRes);

        ActionResult result = actionExecutor.execute(res, dummyContext);
        assertEquals(ActionType.RUN_PRICE_FORECAST, result.getAction());
        assertNotNull(result.getData());
    }
}
