package com.scms.agent;

import com.scms.entity.Product;
import com.scms.service.ProductService;
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

public class FarmerProductUpdateAgentTest {

    @Mock
    private ProductService productService;

    @Mock
    private com.scms.agent.form.DynamicFormActionEngine formActionEngine;

    private PendingProductUpdateManager pendingUpdateManager;
    private FarmerResponseFormatter responseFormatter;
    private FarmerIntentResolver intentResolver;
    private SpeechTranscriptNormalizer normalizer;

    private FarmerActionExecutor actionExecutor;
    private FarmerAgentService agentService;

    private FarmerContext dummyContext;
    private Product dummyTomato;
    private Product dummyRice;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        pendingUpdateManager = new PendingProductUpdateManager();
        responseFormatter = new FarmerResponseFormatter();
        intentResolver = new FarmerIntentResolver();
        normalizer = new SpeechTranscriptNormalizer();

        actionExecutor = new FarmerActionExecutor();
        ReflectionTestUtils.setField(actionExecutor, "productService", productService);
        ReflectionTestUtils.setField(actionExecutor, "responseFormatter", responseFormatter);
        ReflectionTestUtils.setField(actionExecutor, "pendingUpdateManager", pendingUpdateManager);

        agentService = new FarmerAgentService();
        ReflectionTestUtils.setField(agentService, "intentResolver", intentResolver);
        ReflectionTestUtils.setField(agentService, "transcriptNormalizer", normalizer);
        ReflectionTestUtils.setField(agentService, "actionExecutor", actionExecutor);
        ReflectionTestUtils.setField(agentService, "pendingUpdateManager", pendingUpdateManager);
        ReflectionTestUtils.setField(agentService, "productService", productService);
        ReflectionTestUtils.setField(agentService, "responseFormatter", responseFormatter);
        ReflectionTestUtils.setField(agentService, "formActionEngine", formActionEngine);

        dummyContext = new FarmerContext();
        dummyContext.setSupplierId(101);
        dummyContext.setUsername("Muthu");
        dummyContext.setPreferredLanguage("ta");

        dummyTomato = new Product();
        dummyTomato.setProductId(1);
        dummyTomato.setProductName("Tomato");
        dummyTomato.setCategory("Vegetables");
        dummyTomato.setPurchasePrice(30.0);
        dummyTomato.setPrice(35.0);
        dummyTomato.setStock(200);
        dummyTomato.setSupplierId(101);

        dummyRice = new Product();
        dummyRice.setProductId(2);
        dummyRice.setProductName("Rice");
        dummyRice.setCategory("Grains");
        dummyRice.setPurchasePrice(45.0);
        dummyRice.setPrice(52.0);
        dummyRice.setStock(1000);
        dummyRice.setSupplierId(101);

        Product dummyToorDal = new Product();
        dummyToorDal.setProductId(3);
        dummyToorDal.setProductName("Toor Dal");
        dummyToorDal.setCategory("Pulses and Dals");
        dummyToorDal.setPurchasePrice(110.0);
        dummyToorDal.setPrice(125.0);
        dummyToorDal.setStock(400);
        dummyToorDal.setSupplierId(101);

        when(productService.getProductsBySupplierId(101)).thenReturn(List.of(dummyTomato, dummyRice, dummyToorDal));
        when(productService.getProductById(1)).thenReturn(dummyTomato);
        when(productService.getProductById(2)).thenReturn(dummyRice);
        when(productService.getProductById(3)).thenReturn(dummyToorDal);
        when(formActionEngine.hasActiveSession(any(), any())).thenReturn(false);
    }

    // 1. English Stock Update: Proposal & Confirmation Requirement
    @Test
    public void testEnglishStockUpdateRequiresConfirmation() {
        FarmerContext enContext = new FarmerContext();
        enContext.setSupplierId(101);
        enContext.setUsername("Muthu");
        enContext.setPreferredLanguage("en");

        String msg = "Update my tomato stock to 500 kg.";
        ActionResult proposal = agentService.processMessage(msg, enContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("from 200 kg to 500 kg"));
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        // Verify product in database was NOT yet updated
        verify(productService, never()).updateProduct(any());

        // Now Farmer confirms: "yes"
        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            return p;
        });

        ActionResult confirmResult = agentService.processMessage("yes", enContext, Collections.emptyList());
        assertNotNull(confirmResult);
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("Successfully updated stock for 'Tomato' to 500 kg"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
        verify(productService, times(1)).updateProduct(any());
    }

    // 2. Tanglish Stock Update: Proposal & Confirmation
    @Test
    public void testTanglishStockUpdateProposalAndExecution() {
        String msg = "En tomato stock 500 kilo-ku update pannu.";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("200 kg-லிருந்து 500 kg-ஆக"));
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        // Farmer confirms in Tanglish/Tamil: "சரி"
        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ActionResult confirmResult = agentService.processMessage("சரி", dummyContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("500 kg-ஆக மாற்றப்பட்டது"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
    }

    // 3. Tamil Stock Update: Proposal & Cancellation
    @Test
    public void testTamilStockUpdateCancellation() {
        String msg = "என்னுடைய தக்காளி இருப்பை 500 கிலோவாக மாற்று.";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        // Farmer rejects/cancels: "வேண்டாம்"
        ActionResult cancelResult = agentService.processMessage("வேண்டாம்", dummyContext, Collections.emptyList());
        assertTrue(cancelResult.isSuccess());
        assertTrue(cancelResult.getUserMessage().contains("மாற்றம் ரத்து செய்யப்பட்டது"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
        verify(productService, never()).updateProduct(any());
    }

    // 4. English Price Update: Proposal & Confirmation
    @Test
    public void testEnglishPriceUpdate() {
        FarmerContext enContext = new FarmerContext();
        enContext.setSupplierId(101);
        enContext.setUsername("Muthu");
        enContext.setPreferredLanguage("en");

        String msg = "Change tomato price to 42 rupees.";
        ActionResult proposal = agentService.processMessage(msg, enContext, Collections.emptyList());

        assertEquals(ActionType.UPDATE_PRODUCT_PRICE, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("from ₹30.0/kg to ₹42.0/kg"));

        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setPrice(p.getPurchasePrice() + 5.0); // selling price
            return p;
        });

        ActionResult confirmResult = agentService.processMessage("confirm", enContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("Successfully updated price for 'Tomato'"));
        verify(productService, times(1)).updateProduct(any());
    }

    // 5. Tanglish Price Update: Proposal & Confirmation
    @Test
    public void testTanglishPriceUpdate() {
        String msg = "Tomato price 42 rupees-ku mathu.";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertEquals(ActionType.UPDATE_PRODUCT_PRICE, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("30.0/kg-லிருந்து ₹42.0/kg-ஆக"));

        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setPrice(47.0);
            return p;
        });

        ActionResult confirmResult = agentService.processMessage("ok", dummyContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("வெற்றிகரமாக மாற்றப்பட்டது"));
    }

    // 6. Tamil Price Update: Proposal & Confirmation
    @Test
    public void testTamilPriceUpdate() {
        String msg = "தக்காளி விலையை 42 ரூபாயாக மாற்று.";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertEquals(ActionType.UPDATE_PRODUCT_PRICE, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("30.0/kg-லிருந்து ₹42.0/kg-ஆக"));

        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setPrice(47.0);
            return p;
        });

        ActionResult confirmResult = agentService.processMessage("உறுதி", dummyContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("42.0/kg-ஆகவும்"));
    }

    // 7. Multi-turn Clarification: Missing Quantity/Value
    @Test
    public void testClarificationWhenStockQuantityMissing() {
        String msg = "Update my tomato stock.";
        ActionResult result = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertEquals(ActionType.CLARIFICATION_NEEDED, result.getAction());
        assertTrue(result.getUserMessage().contains("புதிய இருப்பு (kg) எவ்வளவு?"));

        // Next turn provides the quantity
        List<Map<String, String>> history = List.of(
            Map.of("role", "user", "content", "Update my tomato stock."),
            Map.of("role", "assistant", "content", "'Tomato' பொருளின் புதிய இருப்பு (kg) எவ்வளவு?")
        );

        ActionResult nextResult = agentService.processMessage("750 kg", dummyContext, history);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, nextResult.getAction());
        assertTrue(nextResult.isRequiresConfirmation());
        assertTrue(nextResult.getUserMessage().contains("200 kg-லிருந்து 750 kg-ஆக"));
    }

    // 8. Multi-turn Clarification: Missing Commodity Name
    @Test
    public void testClarificationWhenProductMissing() {
        FarmerContext enContext = new FarmerContext();
        enContext.setSupplierId(101);
        enContext.setUsername("Muthu");
        enContext.setPreferredLanguage("en");

        String msg = "Update my stock to 600 kg.";
        ActionResult result = agentService.processMessage(msg, enContext, Collections.emptyList());

        assertEquals(ActionType.CLARIFICATION_NEEDED, result.getAction());
        assertTrue(result.getUserMessage().contains("Which product's stock would you like to update?"));

        // Next turn provides the product name
        List<Map<String, String>> history = List.of(
            Map.of("role", "user", "content", "Update my stock to 600 kg."),
            Map.of("role", "assistant", "content", "Which product's stock would you like to update? Please specify the product name.")
        );

        ActionResult nextResult = agentService.processMessage("Rice", enContext, history);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, nextResult.getAction());
        assertTrue(nextResult.isRequiresConfirmation());
        assertTrue(nextResult.getUserMessage().contains("from 1000 kg to 600 kg"));
    }

    // 9. Product Not in Farmer's Catalog
    @Test
    public void testProductNotInCatalog() {
        FarmerContext enContext = new FarmerContext();
        enContext.setSupplierId(101);
        enContext.setUsername("Muthu");
        enContext.setPreferredLanguage("en");

        String msg = "Update my wheat stock to 100 kg.";
        ActionResult result = agentService.processMessage(msg, enContext, Collections.emptyList());

        assertFalse(result.isSuccess());
        assertTrue(result.getUserMessage().contains("Product 'Wheat' not found in your catalog"));
        verify(productService, never()).updateProduct(any());
    }

    // 10. Tamil "ஹெல்ப்" Transliteration Regression Test
    @Test
    public void testTamilHelpCommand() {
        String msg = "ஹெல்ப்";
        ActionResult result = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(result);
        assertEquals(ActionType.HELP, result.getAction());
        assertTrue(result.getUserMessage().contains("நான் செய்யக்கூடிய சில உதவிகள்:"));
    }

    // 11. Tamil Tomato STT Transliteration: "டொமேட்டோ 500 கேஜி க்கு அப்டேட் பண்ணு"
    @Test
    public void testTamilTomatoStockUpdateTransliteration() {
        String msg = "டொமேட்டோ 500 கேஜி க்கு அப்டேட் பண்ணு";
        ActionResult result = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(result);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, result.getAction());
        assertTrue(result.isRequiresConfirmation());
        assertTrue(result.getUserMessage().contains("200 kg-லிருந்து 500 kg-ஆக"));
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        // Confirming it executes successfully
        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ActionResult confirmResult = agentService.processMessage("சரி", dummyContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("500 kg-ஆக மாற்றப்பட்டது"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MANDATORY REAL CONVERSATION SEQUENCE TESTS (TEST 1 - TEST 8)
    // ══════════════════════════════════════════════════════════════════════════

    // TEST 1: "ஹெல்ப்" -> HELP
    @Test
    public void testConversationSequence_1_Help() {
        ActionResult result = agentService.processMessage("ஹெல்ப்", dummyContext, Collections.emptyList());
        assertNotNull(result);
        assertEquals(ActionType.HELP, result.getAction());
        assertTrue(result.getUserMessage().contains("நான் செய்யக்கூடிய சில உதவிகள்:"));
    }

    // TEST 2: "டூர் டால் 500 ச் அப்டேட் பண்ணு" -> UPDATE_PRODUCT_STOCK -> proposal -> "சரி" -> update
    @Test
    public void testConversationSequence_2_ToorDalSttUpdate() {
        String msg = "டூர் டால் 500 ச் க்கு அப்டேட் பண்ணு";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("Toor Dal"));
        assertTrue(proposal.getUserMessage().contains("400 kg-லிருந்து 500 kg-ஆக"));
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ActionResult confirmResult = agentService.processMessage("சரி", dummyContext, Collections.emptyList());
        assertTrue(confirmResult.isSuccess());
        assertTrue(confirmResult.getUserMessage().contains("500 kg-ஆக மாற்றப்பட்டது"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
    }

    // TEST 2B: "டூ டால் 500 கிலோக்கு அப்டேட் பண்ணு" -> UPDATE_PRODUCT_STOCK -> commodity = Toor Dal, quantity = 500
    @Test
    public void testConversationSequence_2B_TooDalKiloSttUpdate() {
        String msg = "டூ டால் 500 கிலோக்கு அப்டேட் பண்ணு";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("Toor Dal"));
        assertTrue(proposal.getUserMessage().contains("400 kg-லிருந்து 500 kg-ஆக"));
    }

    // TEST 2C: Tamil Toor Dal stock update: "துவரம் பருப்பு இருப்பை 600 kg-ஆக மாற்று"
    @Test
    public void testConversationSequence_2C_TamilThuvaramParuppuUpdate() {
        String msg = "துவரம் பருப்பு இருப்பை 600 kg-ஆக மாற்று";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("Toor Dal"));
        assertTrue(proposal.getUserMessage().contains("400 kg-லிருந்து 600 kg-ஆக"));
    }

    // TEST 2D: Tomato stock update must still resolve to Tomato: "தக்காளி இருப்பை 300 kg-ஆக மாற்று"
    @Test
    public void testConversationSequence_2D_TomatoStillResolvesToTomato() {
        String msg = "தக்காளி இருப்பை 300 kg-ஆக மாற்று";
        ActionResult proposal = agentService.processMessage(msg, dummyContext, Collections.emptyList());

        assertNotNull(proposal);
        assertEquals(ActionType.UPDATE_PRODUCT_STOCK, proposal.getAction());
        assertTrue(proposal.isRequiresConfirmation());
        assertTrue(proposal.getUserMessage().contains("Tomato"));
        assertTrue(proposal.getUserMessage().contains("200 kg-லிருந்து 300 kg-ஆக"));
    }

    // TEST 3: "புதிய ப்ராடக்ட் ஆட் பண்ணு" -> form starts -> "தக்காளி" -> next field -> "எக்ஸிட்" -> form cancelled -> "ஹெல்ப்" -> HELP
    @Test
    public void testConversationSequence_3_FormStart_NextField_Exit_Help() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(false, true, true, false);
        when(formActionEngine.handleFormInteraction(eq("புதிய ப்ராடக்ட் ஆட் பண்ணு"), eq(ActionType.CREATE_PRODUCT_LISTING), eq(dummyContext), anyString()))
            .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "சரி, product name சொல்லுங்கள்.", "ta"));
        when(formActionEngine.handleFormInteraction(eq("தக்காளி"), eq(ActionType.CREATE_PRODUCT_LISTING), eq(dummyContext), anyString()))
            .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "category சொல்லுங்கள்.", "ta"));

        // Turn 1: Starts form
        ActionResult r1 = agentService.processMessage("புதிய ப்ராடக்ட் ஆட் பண்ணு", dummyContext, Collections.emptyList());
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, r1.getAction());
        assertTrue(r1.getUserMessage().contains("product name சொல்லுங்கள்"));

        // Turn 2: Provide product name
        ActionResult r2 = agentService.processMessage("தக்காளி", dummyContext, Collections.emptyList());
        assertEquals(ActionType.CREATE_PRODUCT_LISTING, r2.getAction());
        assertTrue(r2.getUserMessage().contains("category சொல்லுங்கள்"));

        // Turn 3: "எக்ஸிட்" cancels active form
        ActionResult r3 = agentService.processMessage("எக்ஸிட்", dummyContext, Collections.emptyList());
        verify(formActionEngine, atLeastOnce()).cancelActiveSession(101, "Muthu");
        assertTrue(r3.getUserMessage().contains("செயல்முறை ரத்து செய்யப்பட்டது"));

        // Turn 4: "ஹெல்ப்" immediately works as HELP action
        ActionResult r4 = agentService.processMessage("ஹெல்ப்", dummyContext, Collections.emptyList());
        assertEquals(ActionType.HELP, r4.getAction());
        assertTrue(r4.getUserMessage().contains("நான் செய்யக்கூடிய சில உதவிகள்:"));
    }

    // TEST 4: "புதிய ப்ராடக்ட் ஆட் பண்ணு" -> form starts -> "தக்காளி" -> next field -> "எக்ஸிட்" -> cancelled -> "தக்காளி price 42 ரூபாய்" -> UPDATE_PRODUCT_PRICE -> proposal -> "சரி"
    @Test
    public void testConversationSequence_4_FormStart_Exit_Then_PriceUpdate() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(false, true, true, false);
        when(formActionEngine.handleFormInteraction(eq("புதிய ப்ராடக்ட் ஆட் பண்ணு"), eq(ActionType.CREATE_PRODUCT_LISTING), eq(dummyContext), anyString()))
            .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "சரி, product name சொல்லுங்கள்.", "ta"));
        when(formActionEngine.handleFormInteraction(eq("தக்காளி"), eq(ActionType.CREATE_PRODUCT_LISTING), eq(dummyContext), anyString()))
            .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "category சொல்லுங்கள்.", "ta"));

        // 1. Start form
        agentService.processMessage("புதிய ப்ராடக்ட் ஆட் பண்ணு", dummyContext, Collections.emptyList());
        // 2. Next field
        agentService.processMessage("தக்காளி", dummyContext, Collections.emptyList());
        // 3. Exit
        ActionResult rExit = agentService.processMessage("எக்ஸிட்", dummyContext, Collections.emptyList());
        assertTrue(rExit.getUserMessage().contains("செயல்முறை ரத்து செய்யப்பட்டது"));

        // 4. Then independent command: Price Update
        ActionResult rUpdate = agentService.processMessage("தக்காளி price 42 ரூபாய்", dummyContext, Collections.emptyList());
        assertEquals(ActionType.UPDATE_PRODUCT_PRICE, rUpdate.getAction());
        assertTrue(rUpdate.isRequiresConfirmation());
        assertTrue(rUpdate.getUserMessage().contains("42.0/kg-ஆக"));
        assertTrue(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));

        // 5. Confirm price update
        when(productService.updateProduct(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ActionResult rConfirm = agentService.processMessage("சரி", dummyContext, Collections.emptyList());
        assertTrue(rConfirm.isSuccess());
        assertTrue(rConfirm.getUserMessage().contains("வெற்றிகரமாக மாற்றப்பட்டது"));
        assertFalse(pendingUpdateManager.hasPendingUpdate(101, "Muthu"));
    }

    // TEST 5: Active product form -> "ஹெல்ப்" -> HELP (does NOT swallow help)
    @Test
    public void testConversationSequence_5_HelpInsideActiveForm() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(true);
        ActionResult result = agentService.processMessage("ஹெல்ப்", dummyContext, Collections.emptyList());

        assertEquals(ActionType.HELP, result.getAction());
        assertTrue(result.getUserMessage().contains("நான் செய்யக்கூடிய சில உதவிகள்:"));
        verify(formActionEngine, never()).handleFormInteraction(any(), any(), any(), any());
    }

    // TEST 6: Active product form -> "cancel" -> form cleared
    @Test
    public void testConversationSequence_6_CancelInsideActiveForm() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(true);
        ActionResult result = agentService.processMessage("cancel", dummyContext, Collections.emptyList());

        verify(formActionEngine, times(1)).cancelActiveSession(101, "Muthu");
        assertTrue(result.getUserMessage().contains("Action cancelled") || result.getUserMessage().contains("ரத்து"));
    }

    // TEST 7: Active product form -> "ரத்து" -> form cleared
    @Test
    public void testConversationSequence_7_TamilRathuInsideActiveForm() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(true);
        ActionResult result = agentService.processMessage("ரத்து", dummyContext, Collections.emptyList());

        verify(formActionEngine, times(1)).cancelActiveSession(101, "Muthu");
        assertTrue(result.getUserMessage().contains("செயல்முறை ரத்து செய்யப்பட்டது"));
    }

    // TEST 8: No active form -> "எக்ஸிட்" -> safe normal response
    @Test
    public void testConversationSequence_8_ExitWithoutActiveForm() {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(false);
        ActionResult result = agentService.processMessage("எக்ஸிட்", dummyContext, Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertTrue(result.getUserMessage().contains("செயல்பாடு முடிந்தது") || result.getUserMessage().contains("Exited"));
    }
}

