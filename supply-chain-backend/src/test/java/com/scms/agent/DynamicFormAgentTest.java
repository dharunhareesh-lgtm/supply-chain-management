package com.scms.agent;

import com.scms.agent.form.*;
import com.scms.entity.Product;
import com.scms.entity.WarehouseLocation;
import com.scms.entity.SupplierLandRecord;
import com.scms.entity.LandRecord;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.LandRecordRepository;
import com.scms.repository.SupplierLandRecordRepository;
import com.scms.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class DynamicFormAgentTest {

    @Mock
    private ProductService productService;

    @Mock
    private WarehouseLocationRepository warehouseLocationRepository;

    @Mock
    private LandRecordRepository landRecordRepository;

    @Mock
    private SupplierLandRecordRepository supplierLandRecordRepository;

    @Mock
    private com.scms.repository.SupplierRepository supplierRepository;

    @Mock
    private com.scms.repository.PackagingStandardRepository packagingStandardRepository;

    @InjectMocks
    private FormSchemaRegistry schemaRegistry;

    @InjectMocks
    private FieldValueExtractor valueExtractor;

    @InjectMocks
    private DynamicFormActionEngine formEngine;

    private DynamicQuestionGenerator questionGenerator;
    private FormSessionManager sessionManager;
    private FarmerContext dummyContext;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        questionGenerator = new DynamicQuestionGenerator();
        sessionManager = new FormSessionManager();

        // Inject dependencies into formEngine via reflection or field assignment
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "schemaRegistry", schemaRegistry);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "questionGenerator", questionGenerator);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "valueExtractor", valueExtractor);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "sessionManager", sessionManager);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "productService", productService);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "warehouseLocationRepository", warehouseLocationRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "landRecordRepository", landRecordRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "supplierRepository", supplierRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "intentResolver", new FarmerIntentResolver());

        SpeechTranscriptNormalizer normalizer = new SpeechTranscriptNormalizer();
        FarmerIntentResolver resolver = new FarmerIntentResolver();
        com.scms.agent.product.ProductKnowledgeProvider knowledgeProvider = new com.scms.agent.product.ProductKnowledgeProvider();
        com.scms.agent.product.ProductUnderstandingService prodUnderstanding = new com.scms.agent.product.ProductUnderstandingService();
        org.springframework.test.util.ReflectionTestUtils.setField(prodUnderstanding, "knowledgeProvider", knowledgeProvider);
        org.springframework.test.util.ReflectionTestUtils.setField(prodUnderstanding, "transcriptNormalizer", normalizer);
        org.springframework.test.util.ReflectionTestUtils.setField(prodUnderstanding, "intentResolver", resolver);

        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "transcriptNormalizer", normalizer);
        org.springframework.test.util.ReflectionTestUtils.setField(formEngine, "productUnderstandingService", prodUnderstanding);
        org.springframework.test.util.ReflectionTestUtils.setField(valueExtractor, "transcriptNormalizer", normalizer);

        org.springframework.test.util.ReflectionTestUtils.setField(valueExtractor, "warehouseLocationRepository", warehouseLocationRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(valueExtractor, "landRecordRepository", landRecordRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(valueExtractor, "supplierLandRecordRepository", supplierLandRecordRepository);

        // Mock categories and warehouses
        when(productService.getAllowedCategories()).thenReturn(List.of("Cereals", "Dry Fruits", "Grains", "Oil Seeds", "Pulses and Dals", "Spices"));

        WarehouseLocation wh = new WarehouseLocation();
        wh.setId(1);
        wh.setWarehouseName("Coimbatore Agri Hub");
        wh.setDistrict("Coimbatore");
        wh.setStatus("ACTIVE");
        when(warehouseLocationRepository.findAll()).thenReturn(List.of(wh));
        when(warehouseLocationRepository.findById(1)).thenReturn(Optional.of(wh));

        // Mock land records
        SupplierLandRecord slr = new SupplierLandRecord();
        slr.setSupplierId(10);
        slr.setLandRecordId(100L);
        when(supplierLandRecordRepository.findBySupplierId(10)).thenReturn(List.of(slr));

        LandRecord lr = new LandRecord();
        lr.setId(100L);
        lr.setSurveyNumber("45/2");
        lr.setVillage("Thoppampatti");
        lr.setDistrict("Coimbatore");
        when(landRecordRepository.findById(100L)).thenReturn(Optional.of(lr));

        dummyContext = new FarmerContext();
        dummyContext.setSupplierId(10);
        dummyContext.setUsername("9876543210");
        dummyContext.setCurrentRoute("/supplier/add-product");
    }

    @Test
    public void testFirstPromptGeneratedWhenInitiatingProductListing() {
        // Farmer says: "I want to add a product" / "ஒரு புதிய product add பண்ணணும்"
        ActionResult res = formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        assertNotNull(res);
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, res.getAction());
        // Regression Rule A: Intent sentence is never captured as productName
        Object capturedName = res.getData() instanceof Map<?, ?> ? ((Map<?, ?>) res.getData()).get("productName") : null;
        assertNull(capturedName, "Intent sentence must NOT be stored as productName!");
        // Should ask for the first missing required field (productName)
        assertTrue(res.getUserMessage().contains("பொருளின் பெயர்"), "Expected prompt for product name in Tamil: " + res.getUserMessage());
    }

    @Test
    public void testSequentialQuestioningOneFieldAtATimeWithoutSilentDefaults() {
        // Turn 1: Farmer provides unmapped crop name where category cannot be auto-inferred
        ActionResult res1 = formEngine.handleFormInteraction("Special Greens", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        assertNotNull(res1);
        // Regression Rule B: Missing category is asked next
        assertTrue(res1.getUserMessage().toLowerCase().contains("category"),
                "Expected question for Category: " + res1.getUserMessage());

        // Turn 2: Farmer provides Category
        ActionResult res2 = formEngine.handleFormInteraction("Spices", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule: Missing base purchase price is asked next
        assertTrue(res2.getUserMessage().toLowerCase().contains("base purchase price"),
                "Expected question for Base Purchase Price: " + res2.getUserMessage());

        // Turn 3: Farmer provides Base Purchase Price
        ActionResult res3 = formEngine.handleFormInteraction("80", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule C: Missing pricing strategy is asked next (NEVER defaulted)
        assertTrue(res3.getUserMessage().toLowerCase().contains("pricing strategy"),
                "Expected question for Pricing Strategy: " + res3.getUserMessage());

        // Turn 4: Farmer provides Pricing Strategy
        ActionResult res4 = formEngine.handleFormInteraction("PROFIT_PER_KG", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule D: Missing profit margin is asked next (NEVER defaulted to 5.0)
        assertTrue(res4.getUserMessage().toLowerCase().contains("profit margin"),
                "Expected question for Profit Margin: " + res4.getUserMessage());

        // Turn 5: Farmer provides Profit Margin
        ActionResult res5 = formEngine.handleFormInteraction("12", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule G: Missing packaging inventory breakdown is asked next
        assertTrue(res5.getUserMessage().toLowerCase().contains("bag") || res5.getUserMessage().toLowerCase().contains("package"),
                "Expected question for Packaging: " + res5.getUserMessage());

        // Turn 6: Farmer provides Packaging
        ActionResult res6 = formEngine.handleFormInteraction("20 bags of 50kg", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule E: Missing warehouse is asked next (NEVER silently auto-selected)
        assertTrue(res6.getUserMessage().toLowerCase().contains("warehouse"),
                "Expected question for Warehouse: " + res6.getUserMessage());

        // Turn 7: Farmer provides Warehouse
        ActionResult res7 = formEngine.handleFormInteraction("Coimbatore", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule F: Missing farmland origin is asked next (NEVER silently auto-selected)
        assertTrue(res7.getUserMessage().toLowerCase().contains("farmland") || res7.getUserMessage().toLowerCase().contains("land"),
                "Expected question for Farmland: " + res7.getUserMessage());

        // Turn 8: Farmer provides Farmland survey number
        ActionResult res8 = formEngine.handleFormInteraction("Survey 45/2", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        // Regression Rule J: Now all fields genuinely provided -> confirmation
        assertTrue(res8.getUserMessage().contains("All required details collected") || res8.getUserMessage().contains("Please review and confirm"),
                "Expected confirmation prompt: " + res8.getUserMessage());
    }

    @Test
    public void testPreFilledUiFormStateSkipsAskedQuestions() {
        // Regression Rule H: Existing live form values are skipped
        Map<String, Object> formState = new HashMap<>();
        formState.put("productName", "Toor Dal");
        formState.put("purchasePrice", 120.0);
        formState.put("category", "Pulses and Dals");
        dummyContext.setExtraData(Map.of("formState", formState));

        // When agent starts form interaction, it should not re-ask productName, purchasePrice, or category
        ActionResult res = formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        assertFalse(res.getUserMessage().toLowerCase().contains("product name"));
        assertFalse(res.getUserMessage().toLowerCase().contains("base purchase price"));
        assertFalse(res.getUserMessage().toLowerCase().contains("category"));
        // It should ask for the next missing field (Pricing Strategy)
        assertTrue(res.getUserMessage().toLowerCase().contains("pricing strategy"));
    }

    @Test
    public void testExplicitFarmerProvidedValuesArePreservedWithoutSilentInventions() {
        // Regression Rule I: Explicit farmer values preserved, missing asked
        ActionResult res = formEngine.handleFormInteraction(
                "Basmati Rice Grains 80 rs PROFIT_PER_KG margin 10 20 bags of 50kg warehouse Coimbatore survey 45/2",
                ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        assertNotNull(res);
        // All fields explicitly given -> Confirmation contains only those values
        assertTrue(res.getUserMessage().contains("All required details collected") || res.getUserMessage().contains("Please review and confirm"),
                "Expected confirmation prompt: " + res.getUserMessage());
        assertTrue(res.getUserMessage().contains("Basmati Rice"));
        assertTrue(res.getUserMessage().contains("80"));
        assertTrue(res.getUserMessage().contains("PROFIT_PER_KG"));
        assertTrue(res.getUserMessage().contains("10"));
        assertTrue(res.getUserMessage().contains("Coimbatore"));
        assertTrue(res.getUserMessage().contains("45/2"));
    }

    @Test
    public void testConfirmationContainsNoSilentlyGeneratedValues() {
        // Simulate step-by-step form execution in Tamil
        Product mockSaved = new Product();
        mockSaved.setProductId(77);
        mockSaved.setProductName("நாட்டு சோளம்");
        when(productService.addProduct(any(Product.class))).thenReturn(mockSaved);

        formEngine.handleFormInteraction("நாட்டு சோளம்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("Grains", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("₹65", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("PROFIT_PER_KG", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("7.5", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("10 மூட்டை 50kg", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("Coimbatore", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        ActionResult confRes = formEngine.handleFormInteraction("45/2", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        // Regression Rule J: Confirmation contains strictly farmer-supplied values
        assertTrue(confRes.getUserMessage().contains("நாட்டு சோளம்"));
        assertTrue(confRes.getUserMessage().contains("65"));
        assertTrue(confRes.getUserMessage().contains("7.5"));
        assertTrue(confRes.getUserMessage().contains("Coimbatore Agri Hub"));
        assertTrue(confRes.getUserMessage().contains("45/2"));
        assertTrue(confRes.getUserMessage().contains("உறுதிப்படுத்தவும்") || confRes.getUserMessage().contains("பட்டியலிட 'சரி'"));

        // Confirm listing
        ActionResult finalRes = formEngine.handleFormInteraction("சரி", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, finalRes.getAction());
        assertTrue(finalRes.getUserMessage().contains("வெற்றிகரமாக பட்டியலிடப்பட்டது"));
        assertEquals("/supplier/products", finalRes.getNavigationPath());
        verify(productService, times(1)).addProduct(any(Product.class));
    }

    @Test
    public void testBackendValidationRejectionHandling() {
        // Simulate backend rejecting perishable item like tomato
        doThrow(new IllegalArgumentException("Perishable commodities (Tomato) are strictly prohibited for dry warehouse storage."))
                .when(productService).addProduct(any(Product.class));

        // Provide complete listing
        formEngine.handleFormInteraction("Tomato Grains 40 rs PROFIT_PER_KG margin 5 10 bags of 50kg warehouse Coimbatore survey 45/2", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        // Confirm
        ActionResult res = formEngine.handleFormInteraction("yes", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        // Should return friendly error and keep session alive for correction
        assertFalse(res.isSuccess());
        assertTrue(res.getUserMessage().contains("Perishable commodities"));
    }

    @Test
    public void testNewCreateProductIntentStartsFreshSessionWithoutStaleValues() {
        // 1. Start CREATE_PRODUCT_LISTING
        formEngine.handleFormInteraction("நாட்டு சோளம்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("Grains", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("65", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        FormExecutionSession active = sessionManager.getSession(10, null);
        assertNotNull(active);
        assertEquals("நாட்டு சோளம்", active.getCollectedFields().get("productName"));
        assertEquals("Grains", active.getCollectedFields().get("category"));
        assertEquals(65.0, active.getCollectedFields().get("purchasePrice"));

        // 3. Farmer stops without confirmation, then later sends explicit NEW CREATE_PRODUCT_LISTING intent
        ActionResult freshRes = formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        // 4. Verify that the session was re-initialized fresh and old values are discarded
        FormExecutionSession freshSession = sessionManager.getSession(10, null);
        assertNotNull(freshSession);
        assertNull(freshSession.getCollectedFields().get("productName"), "Stale productName must not leak into fresh session");
        assertNull(freshSession.getCollectedFields().get("category"), "Stale category must not leak into fresh session");
        assertNull(freshSession.getCollectedFields().get("purchasePrice"), "Stale purchasePrice must not leak into fresh session");
        assertTrue(freshRes.getUserMessage().contains("பெயர்") || freshRes.getUserMessage().contains("product"), "Should ask for initial field");
    }

    @Test
    public void testNumericInputDoesNotCollideWithEntityIds() {
        // Start fresh CREATE_PRODUCT_LISTING
        formEngine.handleFormInteraction("add a new product", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("Organic Wheat", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("Grains", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("40", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("PROFIT_PER_KG", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        FormExecutionSession session = sessionManager.getSession(10, null);
        assertNotNull(session);
        assertEquals("marginValue", session.getLastPromptedField());

        // Farmer replies with bare number "3" for profit margin
        ActionResult marginRes = formEngine.handleFormInteraction("3", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        // Verify: profitMargin = 3.0, warehouseId = missing, landRecordId = missing
        assertEquals(3.0, session.getCollectedFields().get("marginValue"));
        assertNull(session.getCollectedFields().get("warehouseId"), "Bare number 3 must not be greedily assigned to warehouseId");
        assertNull(session.getCollectedFields().get("landRecordId"), "Bare number 3 must not be greedily assigned to landRecordId");

        // Ensure next prompted field is packageBreakdown or warehouseId (not confirmation)
        assertFalse(session.isAwaitingConfirmation(), "Session should not prematurely jump to confirmation");
        assertNotNull(session.getLastPromptedField());
        assertNotEquals("marginValue", session.getLastPromptedField());
    }

    @Test
    public void testWarehouseQueryDoesNotRepeatSameQuestionAndAllowsSelection() {
        // Start form flow up to warehouse prompt
        formEngine.handleFormInteraction("Organic Wheat", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("Grains", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("45", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("PROFIT_PER_KG", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("5", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("10 bags of 50kg", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        FormExecutionSession session = sessionManager.getSession(10, null);
        assertNotNull(session);
        assertEquals("warehouseId", session.getLastPromptedField());

        // Farmer asks "which warehouse near me" instead of repeating or guessing an ID
        ActionResult queryRes = formEngine.handleFormInteraction("which warehouse near me", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        // Engine must provide warehouse options with IDs and not simply repeat "Please specify the Warehouse Hub name or reference."
        assertFalse(queryRes.getUserMessage().contains("Please specify the Warehouse Hub name or reference."));
        assertTrue(queryRes.getUserMessage().contains("Available Warehouse Hubs:"));
        assertTrue(queryRes.getUserMessage().contains("Coimbatore Agri Hub"));
        assertTrue(queryRes.getUserMessage().contains("ID 1"));

        // Next, farmer chooses from the presented options explicitly: "1"
        ActionResult chosenRes = formEngine.handleFormInteraction("1", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        assertEquals(1, session.getCollectedFields().get("warehouseId"));
        // Now moves to next missing field (landRecordId)
        assertEquals("landRecordId", session.getLastPromptedField());
    }

    @Test
    public void testConsistentSelectedLanguageTamilAndEnglish() {
        FarmerIntentResolver resolver = new FarmerIntentResolver();

        // 1. When preferredLanguage is Tamil
        FarmerContext tamilContext = new FarmerContext();
        tamilContext.setPreferredLanguage("ta");
        IntentResolution resTa = resolver.resolveIntent("show my products", tamilContext, Collections.emptyList());
        assertEquals("ta", resTa.getLanguage(), "Should honor preferredLanguage = ta even for English voice transcript");

        // 2. When preferredLanguage is English
        FarmerContext enContext = new FarmerContext();
        enContext.setPreferredLanguage("en");
        IntentResolution resEn = resolver.resolveIntent("என்னோட products காட்டு", enContext, Collections.emptyList());
        assertEquals("en", resEn.getLanguage(), "Should honor preferredLanguage = en when explicitly set by farmer");
    }

    @Test
    public void testSTTTranscriptNormalizationAndEntityIntegrity() {
        SpeechTranscriptNormalizer normalizer = new SpeechTranscriptNormalizer();
        FarmerIntentResolver resolver = new FarmerIntentResolver();

        // 1. Tamil spoken STT transcript: "ஒரு புதிய ப்ராடக்ட் ஆட் பண்ணனும்"
        String tamilStt = "ஒரு புதிய ப்ராடக்ட் ஆட் பண்ணனும்";
        String normalizedTamil = normalizer.normalize(tamilStt);
        IntentResolution intentTa = resolver.resolveIntent(normalizedTamil, dummyContext, Collections.emptyList());
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, intentTa.getAction(),
                "Tamil STT transcript should normalize to CREATE_PRODUCT_LISTING");

        // 2. English spoken STT transcript in Tamil script: "நீட் டு ஆட் நியூ ப்ராடக்ட்"
        String englishStt = "நீட் டு ஆட் நியூ ப்ராடக்ட்";
        String normalizedEnglish = normalizer.normalize(englishStt);
        IntentResolution intentEn = resolver.resolveIntent(normalizedEnglish, dummyContext, Collections.emptyList());
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, intentEn.getAction(),
                "English STT phonetic transcript should normalize to CREATE_PRODUCT_LISTING");

        // 3. Existing exact text: "ஒரு புதிய product add பண்ணணும்"
        String exactText = "ஒரு புதிய product add பண்ணணும்";
        String normalizedExact = normalizer.normalize(exactText);
        IntentResolution intentExact = resolver.resolveIntent(normalizedExact, dummyContext, Collections.emptyList());
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, intentExact.getAction(),
                "Existing exact text command must continue working");

        // 4. Actual crop/product name: "நாட்டு சோளம்"
        // Normalization must NEVER alter genuine farmer entity values
        String cropName = "நாட்டு சோளம்";
        String normalizedCrop = normalizer.normalize(cropName);
        assertEquals("நாட்டு சோளம்", normalizedCrop, "Actual farmer crop/product name must NOT be altered by normalizer");

        // 5. Existing read intents still work after normalization
        String readStt = "என்னோட ப்ராடக்ட்ஸ் காட்டு";
        String normalizedRead = normalizer.normalize(readStt);
        IntentResolution readIntent = resolver.resolveIntent(normalizedRead, dummyContext, Collections.emptyList());
        assertEquals(ActionType.GET_MY_PRODUCTS, readIntent.getAction(), "Read intents must work smoothly with STT normalization");
    }

    @Test
    public void testInvalidProductCommandRejectedAsProductName() {
        // Test A: Spoken command "நீட் டு ஏர் நியூ புரோடக்ட்"
        formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        ActionResult resA = formEngine.handleFormInteraction("நீட் டு ஏர் நியூ புரோடக்ட்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        FormExecutionSession session = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertNotNull(session);
        assertNull(session.getCollectedFields().get("productName"), "Command must NOT be stored as productName!");
        assertTrue(resA.getUserMessage().contains("பெயராக தெரியவில்லை") || resA.getUserMessage().contains("பொருளின் பெயரை"),
                "Expected rejection feedback: " + resA.getUserMessage());

        // Test B: English command "I want to add a new product"
        ActionResult resB = formEngine.handleFormInteraction("I want to add a new product", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        assertNull(session.getCollectedFields().get("productName"), "English command must NOT be stored as productName!");
        assertTrue(resB.getUserMessage().contains("doesn't appear to be a product name") || resB.getUserMessage().contains("tell me the product name"),
                "Expected English rejection feedback: " + resB.getUserMessage());
    }

    @Test
    public void testTamilProductUnderstandingAndInference() {
        // Test C: Tamil product "நெல்" (Paddy -> Cereals)
        formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        ActionResult res = formEngine.handleFormInteraction("நெல்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        FormExecutionSession session = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertNotNull(session);
        assertEquals("நெல்", session.getCollectedFields().get("productName"));
        assertEquals("Cereals", session.getCollectedFields().get("category"));
        assertEquals(FieldSource.INFERRED, session.getFieldSource("category"));
        assertTrue(res.getUserMessage().contains("Cereals category என்று புரிந்துகொண்டேன்"),
                "Expected category understanding message: " + res.getUserMessage());
        // Next missing field should be purchasePrice, NOT category!
        assertEquals("purchasePrice", session.getLastPromptedField());
    }

    @Test
    public void testEnglishAndTanglishProductUnderstanding() {
        // Test D: English "paddy"
        formEngine.handleFormInteraction("add product", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        ActionResult resEn = formEngine.handleFormInteraction("paddy", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        FormExecutionSession sessionEn = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertEquals("paddy", sessionEn.getCollectedFields().get("productName"));
        assertEquals("Cereals", sessionEn.getCollectedFields().get("category"));
        assertEquals(FieldSource.INFERRED, sessionEn.getFieldSource("category"));
        assertTrue(resEn.getUserMessage().contains("Understood") && resEn.getUserMessage().contains("Cereals category"),
                "Expected English category inference message: " + resEn.getUserMessage());

        // Test E: Tanglish "nel"
        formEngine.handleFormInteraction("add product", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        ActionResult resTa = formEngine.handleFormInteraction("nel", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        FormExecutionSession sessionTa = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertEquals("nel", sessionTa.getCollectedFields().get("productName"));
        assertEquals("Cereals", sessionTa.getCollectedFields().get("category"));
    }

    @Test
    public void testUnknownProductDoesNotHallucinateCategory() {
        // Test F: Unknown product "மலைக்கீரை"
        formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        ActionResult res = formEngine.handleFormInteraction("மலைக்கீரை", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        FormExecutionSession session = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertNotNull(session);
        assertEquals("மலைக்கீரை", session.getCollectedFields().get("productName"));
        assertNull(session.getCollectedFields().get("category"), "Unknown product category must NOT be hallucinated!");
        // Must prompt farmer to choose category from available options
        assertEquals("category", session.getLastPromptedField());
        assertTrue(res.getUserMessage().contains("பொருள் வகை") || res.getUserMessage().contains("Category"),
                "Expected prompt for Category: " + res.getUserMessage());
    }

    @Test
    public void testFarmerExplicitCategorySelectionOverridesInference() {
        // Test G: Farmer provides "நெல்" (infers Cereals), but then says "Grains"
        formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        formEngine.handleFormInteraction("நெல்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");

        FormExecutionSession session = sessionManager.getSession(dummyContext.getSupplierId(), dummyContext.getUsername());
        assertEquals("Cereals", session.getCollectedFields().get("category"));
        assertEquals(FieldSource.INFERRED, session.getFieldSource("category"));

        // Farmer explicitly provides "Grains" along with price "₹45"
        formEngine.handleFormInteraction("Grains 45", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "ta");
        assertEquals("Grains", session.getCollectedFields().get("category"), "Explicit category selection must override inferred value");
        assertEquals(FieldSource.FARMER_PROVIDED, session.getFieldSource("category"));
        assertEquals(45.0, session.getCollectedFields().get("purchasePrice"));
    }

    @Test
    public void testConfirmationSummaryDisplaysInferredLabel() {
        // Test H: Inferred category is labeled in confirmation summary
        formEngine.handleFormInteraction("ஒரு புதிய product add பண்ணணும்", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("paddy", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("50", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("PROFIT_PER_KG", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("5", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("20 bags of 50kg", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        formEngine.handleFormInteraction("Coimbatore", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");
        ActionResult confRes = formEngine.handleFormInteraction("45/2", ActionType.CREATE_PRODUCT_LISTING, dummyContext, "en");

        assertTrue(confRes.getUserMessage().contains("Category: Cereals (inferred)"),
                "Expected confirmation to display '(inferred)' suffix for category: " + confRes.getUserMessage());
    }
}

