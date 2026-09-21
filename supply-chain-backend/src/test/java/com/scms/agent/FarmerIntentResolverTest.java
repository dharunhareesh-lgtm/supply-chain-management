package com.scms.agent;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class FarmerIntentResolverTest {

    private FarmerIntentResolver resolver;
    private FarmerContext dummyContext;

    @BeforeEach
    public void setup() {
        resolver = new FarmerIntentResolver();
        dummyContext = new FarmerContext();
        dummyContext.setSupplierId(1);
        dummyContext.setUsername("9876543210");
        dummyContext.setRole("SUPPLIER");
        dummyContext.setCurrentRoute("/supplier");
    }

    @Test
    public void testEnglishProductsIntent() {
        IntentResolution res = resolver.resolveIntent("show my products", dummyContext, null);
        assertEquals(ActionType.GET_MY_PRODUCTS, res.getAction());
        assertEquals("en", res.getLanguage());
    }

    @Test
    public void testTamilProductsIntent() {
        IntentResolution res = resolver.resolveIntent("என்னோட products காட்டு", dummyContext, null);
        assertEquals(ActionType.GET_MY_PRODUCTS, res.getAction());
        assertEquals("ta", res.getLanguage());
    }

    @Test
    public void testTanglishProductsIntent() {
        IntentResolution res = resolver.resolveIntent("enoda products kaatu", dummyContext, null);
        assertEquals(ActionType.GET_MY_PRODUCTS, res.getAction());
        assertEquals("ta", res.getLanguage());
    }

    @Test
    public void testMixedRevenueIntent() {
        IntentResolution res = resolver.resolveIntent("எவ்வளவு revenue வந்திருக்கு?", dummyContext, null);
        assertEquals(ActionType.GET_FINANCIAL_SUMMARY, res.getAction());
        assertEquals("ta", res.getLanguage());
    }

    @Test
    public void testNavigationForecastIntent() {
        IntentResolution res = resolver.resolveIntent("forecast page open பண்ணு", dummyContext, null);
        assertEquals(ActionType.NAVIGATE_TO_FORECAST, res.getAction());
    }

    @Test
    public void testMandiPriceWithLocation() {
        IntentResolution res = resolver.resolveIntent("tomato price in Pollachi", dummyContext, null);
        assertEquals(ActionType.GET_MANDI_PRICE, res.getAction());
        assertEquals("Tomato", res.getResolvedCrop());
        assertEquals("Pollachi", res.getResolvedLocation());
        assertFalse(res.isClarificationNeeded());
    }

    @Test
    public void testMultiTurnClarification() {
        // Turn 1: User asks for crop price without location
        IntentResolution turn1 = resolver.resolveIntent("tomato price என்ன?", dummyContext, null);
        assertEquals(ActionType.GET_MANDI_PRICE, turn1.getAction());
        assertTrue(turn1.isClarificationNeeded());

        // Turn 2: History contains turn 1 prompt
        List<Map<String, String>> history = new ArrayList<>();
        history.add(Map.of("role", "user", "content", "tomato price என்ன?"));
        history.add(Map.of("role", "assistant", "content", "எந்த ஊர் அல்லது மண்டி விலை பார்க்க வேண்டும்?"));

        IntentResolution turn2 = resolver.resolveIntent("Pollachi", dummyContext, history);
        assertEquals(ActionType.GET_MANDI_PRICE, turn2.getAction());
        assertEquals("Pollachi", turn2.getResolvedLocation());
        assertFalse(turn2.isClarificationNeeded());
    }

    @Test
    public void testContextSensitiveProductQuery() {
        dummyContext.setSelectedProductId(5);
        IntentResolution res = resolver.resolveIntent("இந்த product details சொல்லு", dummyContext, null);
        assertEquals(ActionType.GET_PRODUCT_DETAILS, res.getAction());
        assertEquals(5, res.getParameters().get("productId"));
    }

    @Test
    public void testGreeting() {
        IntentResolution res = resolver.resolveIntent("வணக்கம்", dummyContext, null);
        assertEquals(ActionType.GREETING, res.getAction());
        assertEquals("ta", res.getLanguage());

        IntentResolution resEng = resolver.resolveIntent("Hello", dummyContext, null);
        assertEquals(ActionType.GREETING, resEng.getAction());
        assertEquals("en", resEng.getLanguage());
    }

    @Test
    public void testCreateProductListingTamil() {
        IntentResolution res1 = resolver.resolveIntent("ஒரு புதிய product add பண்ணணும்", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res1.getAction());
        assertEquals("ta", res1.getLanguage());

        IntentResolution res2 = resolver.resolveIntent("புதிய பொருள் சேர்க்கணும்", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res2.getAction());
        assertEquals("ta", res2.getLanguage());

        IntentResolution res3 = resolver.resolveIntent("புதிய product சேர்க்கணும்", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res3.getAction());
        assertEquals("ta", res3.getLanguage());
    }

    @Test
    public void testCreateProductListingTanglish() {
        IntentResolution res1 = resolver.resolveIntent("new product add pannanum", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res1.getAction());
        assertEquals("ta", res1.getLanguage());

        IntentResolution res2 = resolver.resolveIntent("product add pananum", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res2.getAction());
        assertEquals("ta", res2.getLanguage());
    }

    @Test
    public void testCreateProductListingEnglish() {
        IntentResolution res1 = resolver.resolveIntent("add a new product", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res1.getAction());
        assertEquals("en", res1.getLanguage());

        IntentResolution res2 = resolver.resolveIntent("I want to add a product", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res2.getAction());
        assertEquals("en", res2.getLanguage());

        IntentResolution res3 = resolver.resolveIntent("create a product listing", dummyContext, null);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res3.getAction());
        assertEquals("en", res3.getLanguage());
    }

    @Test
    public void testPriceForecastUnspecifiedCropClarification() {
        // Test 1 & 2: Click Tamil "முன்னறிவிப்பு" ("விலை கணிப்பு காட்டு") or English "show price forecast"
        // Without a selected crop in context, backend must ask which crop
        IntentResolution resTa = resolver.resolveIntent("விலை கணிப்பு காட்டு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, resTa.getAction());
        assertTrue(resTa.isClarificationNeeded());
        assertEquals("எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?", resTa.getClarificationPrompt());
        assertNull(resTa.getResolvedCrop());

        IntentResolution resEn = resolver.resolveIntent("show price forecast", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, resEn.getAction());
        assertTrue(resEn.isClarificationNeeded());
        assertEquals("Which crop would you like a price forecast for?", resEn.getClarificationPrompt());
        assertNull(resEn.getResolvedCrop());
    }

    @Test
    public void testPriceForecastExplicitCrop() {
        // Test 3: "tomato price forecast சொல்லு" -> Tomato forecast action
        IntentResolution res1 = resolver.resolveIntent("tomato price forecast சொல்லு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res1.getAction());
        assertFalse(res1.isClarificationNeeded());
        assertEquals("Tomato", res1.getResolvedCrop());

        // Test 4: Explicit Tamil tomato forecast -> "தக்காளி விலை கணிப்பு சொல்லு"
        IntentResolution res2 = resolver.resolveIntent("தக்காளி விலை கணிப்பு சொல்லு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res2.getAction());
        assertFalse(res2.isClarificationNeeded());
        assertEquals("Tomato", res2.getResolvedCrop());
    }

    @Test
    public void testPriceForecastContextCrop() {
        // Test 5: Selected crop exists -> use selected crop instead of Tomato
        dummyContext.setSelectedCrop("Toor Dal");
        IntentResolution res = resolver.resolveIntent("விலை கணிப்பு காட்டு", dummyContext, null);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertFalse(res.isClarificationNeeded());
        assertEquals("Toor Dal", res.getResolvedCrop());
    }

    @Test
    public void testPriceForecastMultiTurnClarification() {
        // Turn 1: Farmer asked for forecast without crop
        // Turn 2: History contains prompt asking for crop, user responds with crop name
        List<Map<String, String>> history = new ArrayList<>();
        history.add(Map.of("role", "user", "content", "விலை கணிப்பு காட்டு"));
        history.add(Map.of("role", "assistant", "content", "எந்த பயிருக்கு விலை கணிப்பு வேண்டும்?"));

        IntentResolution res = resolver.resolveIntent("Toor Dal", dummyContext, history);
        assertEquals(ActionType.RUN_PRICE_FORECAST, res.getAction());
        assertFalse(res.isClarificationNeeded());
        assertEquals("Toor Dal", res.getResolvedCrop());
    }
}
