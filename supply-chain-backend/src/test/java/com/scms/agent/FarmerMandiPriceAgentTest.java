package com.scms.agent;

import com.scms.entity.GovMarketObservation;
import com.scms.repository.GovMarketObservationRepository;
import com.scms.service.ForecastService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class FarmerMandiPriceAgentTest {

    @Mock
    private ForecastService forecastService;

    @Mock
    private GovMarketObservationRepository govMarketObservationRepository;

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
        ReflectionTestUtils.setField(actionExecutor, "govMarketObservationRepository", govMarketObservationRepository);

        dummyContext = new FarmerContext();
        dummyContext.setSupplierId(101);
        dummyContext.setUsername("Muthu");
        dummyContext.setPreferredLanguage("ta");
    }

    private GovMarketObservation createDummyObservation(String commodity, String market, String district, double modal, LocalDate date, String variety) {
        GovMarketObservation obs = new GovMarketObservation();
        obs.setCommodity(commodity);
        obs.setMarket(market);
        obs.setDistrict(district);
        obs.setState("Tamil Nadu");
        obs.setMinPrice(modal - 200.0);
        obs.setMaxPrice(modal + 300.0);
        obs.setModalPrice(modal);
        obs.setPricePerKg(modal / 100.0);
        obs.setMarketDate(date);
        obs.setVariety(variety);
        return obs;
    }

    // a) English: "What is today's tomato price in Pollachi?"
    @Test
    public void testEnglishMandiPriceQuery() {
        FarmerContext enContext = new FarmerContext();
        enContext.setSupplierId(101);
        enContext.setUsername("Muthu");
        enContext.setPreferredLanguage("en");

        String query = "What is today's tomato price in Pollachi?";
        IntentResolution intent = intentResolver.resolveIntent(query, enContext, Collections.emptyList());

        assertEquals(ActionType.GET_MANDI_PRICE, intent.getAction());
        assertEquals("Tomato", intent.getResolvedCrop());
        assertEquals("Pollachi", intent.getResolvedLocation());

        GovMarketObservation obs = createDummyObservation("Tomato", "Pollachi", "Coimbatore", 3500.0, LocalDate.now(), "Local");
        when(forecastService.getLatestMarketPrice(eq("Tomato"), eq("Tamil Nadu"), eq(""), eq("Pollachi"), isNull()))
                .thenReturn(obs);

        ActionResult result = actionExecutor.execute(intent, enContext);
        assertNotNull(result);
        assertTrue(result.getUserMessage().contains("Pollachi"));
        assertTrue(result.getUserMessage().contains("Tomato"));
        assertTrue(result.getUserMessage().contains("35.0/kg"));
        assertTrue(result.getUserMessage().contains("3,500/quintal"));
    }

    // b) Tanglish: "Pollachi la tomato rate enna?"
    @Test
    public void testTanglishMandiPriceQuery() {
        String query = "Pollachi la tomato rate enna?";
        IntentResolution intent = intentResolver.resolveIntent(query, dummyContext, Collections.emptyList());

        assertEquals(ActionType.GET_MANDI_PRICE, intent.getAction());
        assertEquals("Tomato", intent.getResolvedCrop());
        assertEquals("Pollachi", intent.getResolvedLocation());

        GovMarketObservation obs = createDummyObservation("Tomato", "Pollachi", "Coimbatore", 4000.0, LocalDate.now(), "Hybrid");
        when(forecastService.getLatestMarketPrice(eq("Tomato"), eq("Tamil Nadu"), eq(""), eq("Pollachi"), isNull()))
                .thenReturn(obs);

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        assertTrue(result.getUserMessage().contains("Pollachi"));
        assertTrue(result.getUserMessage().contains("40.0/kg"));
    }

    // c) Tamil: "பொள்ளாச்சியில் தக்காளி விலை என்ன?"
    @Test
    public void testTamilMandiPriceQuery() {
        String query = "பொள்ளாச்சியில் தக்காளி விலை என்ன?";
        IntentResolution intent = intentResolver.resolveIntent(query, dummyContext, Collections.emptyList());

        assertEquals(ActionType.GET_MANDI_PRICE, intent.getAction());
        assertEquals("Tomato", intent.getResolvedCrop());
        assertEquals("Pollachi", intent.getResolvedLocation());

        GovMarketObservation obs = createDummyObservation("Tomato", "Pollachi", "Coimbatore", 3800.0, LocalDate.now(), "நாட்டு தக்காளி");
        when(forecastService.getLatestMarketPrice(eq("Tomato"), eq("Tamil Nadu"), eq(""), eq("Pollachi"), isNull()))
                .thenReturn(obs);

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        assertTrue(result.getUserMessage().contains("மண்டி நிலவரம்"));
        assertTrue(result.getUserMessage().contains("38.0/kg"));
        assertTrue(result.getUserMessage().contains("பதிவு தேதி"));
    }

    // d) District-level request: "Erode tomato price"
    @Test
    public void testDistrictLevelRequestAndFallback() {
        String query = "Erode tomato price";
        IntentResolution intent = intentResolver.resolveIntent(query, dummyContext, Collections.emptyList());

        assertEquals(ActionType.GET_MANDI_PRICE, intent.getAction());
        assertEquals("Tomato", intent.getResolvedCrop());
        assertEquals("Erode", intent.getResolvedLocation());

        // Exact market match fails
        when(forecastService.getLatestMarketPrice(eq("Tomato"), eq("Tamil Nadu"), eq(""), eq("Erode"), isNull()))
                .thenReturn(null);
        when(forecastService.matchToGovernmentCommodity("Tomato")).thenReturn("Tomato");

        // Fuzzy market match fails
        when(govMarketObservationRepository.findLatestByCommodityStateMarketFuzzy("Tomato", "Tamil Nadu", "Erode"))
                .thenReturn(Collections.emptyList());

        // District-level match succeeds!
        GovMarketObservation districtObs = createDummyObservation("Tomato", "Perundurai", "Erode", 3200.0, LocalDate.now(), "Local");
        when(govMarketObservationRepository.findLatestByCommodityStateDistrict("Tomato", "Tamil Nadu", "Erode"))
                .thenReturn(List.of(districtObs));

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        assertEquals(districtObs, result.getData());
        assertTrue(result.getUserMessage().contains("Perundurai"));
        assertTrue(result.getUserMessage().contains("32.0/kg"));
    }

    // e) Fuzzy market matching: "Pollachi" -> "Pollachi(Uzhavar Sandhai)"
    @Test
    public void testFuzzyMarketMatching() {
        IntentResolution intent = new IntentResolution(ActionType.GET_MANDI_PRICE, "en", Collections.emptyMap());
        intent.setResolvedCrop("Tomato");
        intent.setResolvedLocation("Pollachi");

        // Exact match fails
        when(forecastService.getLatestMarketPrice(eq("Tomato"), eq("Tamil Nadu"), eq(""), eq("Pollachi"), isNull()))
                .thenReturn(null);
        when(forecastService.matchToGovernmentCommodity("Tomato")).thenReturn("Tomato");

        // Fuzzy query finds "Pollachi(Uzhavar Sandhai)"
        GovMarketObservation fuzzyObs = createDummyObservation("Tomato", "Pollachi(Uzhavar Sandhai)", "Coimbatore", 4200.0, LocalDate.now(), "Local");
        when(govMarketObservationRepository.findLatestByCommodityStateMarketFuzzy("Tomato", "Tamil Nadu", "Pollachi"))
                .thenReturn(List.of(fuzzyObs));

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        assertEquals(fuzzyObs, result.getData());
        assertTrue(result.getUserMessage().contains("Pollachi(Uzhavar Sandhai)"));
        assertTrue(result.getUserMessage().contains("42.0/kg"));
    }

    // f) Response contains observation date and freshness notice if older than 2 days
    @Test
    public void testResponseContainsObservationDateAndStaleNotice() {
        IntentResolution intent = new IntentResolution(ActionType.GET_MANDI_PRICE, "ta", Collections.emptyMap());
        intent.setResolvedCrop("Rice");
        intent.setResolvedLocation("Salem");

        LocalDate olderDate = LocalDate.now().minusDays(5);
        GovMarketObservation obs = createDummyObservation("Rice", "Salem", "Salem", 5000.0, olderDate, "Ponni");
        when(forecastService.getLatestMarketPrice(eq("Rice"), eq("Tamil Nadu"), eq(""), eq("Salem"), isNull()))
                .thenReturn(obs);

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        String msg = result.getUserMessage();

        String expectedDate = olderDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        assertTrue(msg.contains(expectedDate), "Response must contain formatted date");
        assertTrue(msg.contains("நாட்களுக்கு முந்தைய நிலவரம்"), "Response must show freshness notice for data older than 2 days");
        assertTrue(msg.contains("Ponni"), "Response must show variety");
    }

    // g) Fallback behavior when no matching market price is found
    @Test
    public void testNoMatchingMarketPriceFallback() {
        IntentResolution intent = new IntentResolution(ActionType.GET_MANDI_PRICE, "ta", Collections.emptyMap());
        intent.setResolvedCrop("Wheat");
        intent.setResolvedLocation("RemoteVillage");

        when(forecastService.getLatestMarketPrice(any(), any(), any(), any(), any())).thenReturn(null);
        when(forecastService.matchToGovernmentCommodity("Wheat")).thenReturn("Wheat");
        when(govMarketObservationRepository.findLatestByCommodityStateMarketFuzzy(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(govMarketObservationRepository.findLatestByCommodityStateDistrict(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ActionResult result = actionExecutor.execute(intent, dummyContext);
        assertNotNull(result);
        assertNull(result.getData());
        assertTrue(result.getUserMessage().contains("அரசு விலை விவரங்கள் தற்போது கிடைக்கவில்லை"));
    }
}
