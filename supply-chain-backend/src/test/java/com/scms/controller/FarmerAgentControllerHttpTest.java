package com.scms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scms.agent.*;
import com.scms.entity.Product;
import com.scms.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class FarmerAgentControllerHttpTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProductService productService;

    @Mock
    private com.scms.agent.form.DynamicFormActionEngine formActionEngine;

    private FarmerAgentService agentService;
    private FarmerAgentController controller;
    private PendingProductUpdateManager pendingUpdateManager;
    private FarmerResponseFormatter responseFormatter;
    private FarmerIntentResolver intentResolver;
    private SpeechTranscriptNormalizer normalizer;
    private FarmerActionExecutor actionExecutor;

    private Product dummyTomato;

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

        controller = new FarmerAgentController();
        ReflectionTestUtils.setField(controller, "agentService", agentService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        dummyTomato = new Product();
        dummyTomato.setProductId(1);
        dummyTomato.setProductName("Tomato");
        dummyTomato.setCategory("Vegetables");
        dummyTomato.setPurchasePrice(30.0);
        dummyTomato.setPrice(35.0);
        dummyTomato.setStock(200);
        dummyTomato.setSupplierId(101);

        Product dummyToorDal = new Product();
        dummyToorDal.setProductId(3);
        dummyToorDal.setProductName("Toor Dal");
        dummyToorDal.setCategory("Pulses and Dals");
        dummyToorDal.setPurchasePrice(110.0);
        dummyToorDal.setPrice(125.0);
        dummyToorDal.setStock(400);
        dummyToorDal.setSupplierId(101);

        when(productService.getProductsBySupplierId(101)).thenReturn(List.of(dummyTomato, dummyToorDal));
        when(productService.getProductById(1)).thenReturn(dummyTomato);
        when(productService.getProductById(3)).thenReturn(dummyToorDal);
        when(formActionEngine.hasActiveSession(any(), any())).thenReturn(false);
    }

    private Map<String, Object> buildFrontendPayload(String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", message);

        Map<String, Object> context = new HashMap<>();
        context.put("supplierId", 101);
        context.put("username", "Muthu");
        context.put("role", "SUPPLIER");
        context.put("currentRoute", "/supplier");
        context.put("currentPage", "Supplier Dashboard");
        context.put("selectedProductId", null);
        context.put("selectedOrderId", null);
        context.put("preferredLanguage", "ta");
        context.put("extraData", Collections.emptyMap());

        payload.put("context", context);
        payload.put("sessionHistory", Collections.emptyList());
        return payload;
    }

    // A. HTTP request: "ஹெல்ப்" -> HELP
    @Test
    public void testHttpTamilHelp() throws Exception {
        Map<String, Object> payload = buildFrontendPayload("ஹெல்ப்");

        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.action").value("HELP"))
                .andExpect(jsonPath("$.userMessage", containsString("நான் செய்யக்கூடிய சில உதவிகள்")));
    }

    // B. HTTP request: "help" -> HELP
    @Test
    public void testHttpEnglishHelp() throws Exception {
        Map<String, Object> payload = buildFrontendPayload("help");

        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.action").value("HELP"))
                .andExpect(jsonPath("$.userMessage", containsString("Here are things you can ask me")));
    }

    // C. HTTP request: "டூர் டால் 500 ச் க்கு அப்டேட் பண்ணு" -> UPDATE_PRODUCT_STOCK (Toor Dal, 500 kg)
    @Test
    public void testHttpToorDalSttStockUpdate() throws Exception {
        Map<String, Object> payload = buildFrontendPayload("டூர் டால் 500 ச் க்கு அப்டேட் பண்ணு");

        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.action").value("UPDATE_PRODUCT_STOCK"))
                .andExpect(jsonPath("$.requiresConfirmation").value(true))
                .andExpect(jsonPath("$.userMessage", containsString("Toor Dal")))
                .andExpect(jsonPath("$.userMessage", containsString("500 kg-ஆக")));
    }

    // D. HTTP request: "டூ டால் 500 கிலோக்கு அப்டேட் பண்ணு" -> UPDATE_PRODUCT_STOCK (Toor Dal, 500 kg)
    @Test
    public void testHttpTooDalKiloStockUpdate() throws Exception {
        Map<String, Object> payload = buildFrontendPayload("டூ டால் 500 கிலோக்கு அப்டேட் பண்ணு");

        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.action").value("UPDATE_PRODUCT_STOCK"))
                .andExpect(jsonPath("$.requiresConfirmation").value(true))
                .andExpect(jsonPath("$.userMessage", containsString("Toor Dal")))
                .andExpect(jsonPath("$.userMessage", containsString("500 kg-ஆக")));
    }

    // E, F, G. Sequence: Form Create -> "தக்காளி" -> "எக்ஸிட்" -> Form cleared -> "ஹெல்ப்" -> HELP -> "தக்காளி price 42 ரூபாய்" -> UPDATE_PRODUCT_PRICE
    @Test
    public void testHttpFormSessionExitAndSubsequentCommands() throws Exception {
        when(formActionEngine.hasActiveSession(101, "Muthu")).thenReturn(false, true, true, false, false, false);
        when(formActionEngine.handleFormInteraction(eq("புதிய ப்ராடக்ட் ஆட் பண்ணு"), eq(ActionType.CREATE_PRODUCT_LISTING), any(), anyString()))
                .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "சரி, product name சொல்லுங்கள்.", "ta"));
        when(formActionEngine.handleFormInteraction(eq("தக்காளி"), eq(ActionType.CREATE_PRODUCT_LISTING), any(), anyString()))
                .thenReturn(ActionResult.success(ActionType.CREATE_PRODUCT_LISTING, null, "category சொல்லுங்கள்.", "ta"));

        // Step 1: Start Form
        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildFrontendPayload("புதிய ப்ராடக்ட் ஆட் பண்ணு"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("CREATE_PRODUCT_LISTING"));

        // Step 2: Next Field
        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildFrontendPayload("தக்காளி"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("CREATE_PRODUCT_LISTING"));

        // Step 3: Exit Form
        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildFrontendPayload("எக்ஸிட்"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userMessage", containsString("செயல்முறை ரத்து செய்யப்பட்டது")));

        // Step 4: After exit -> "ஹெல்ப்" -> HELP
        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildFrontendPayload("ஹெல்ப்"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("HELP"))
                .andExpect(jsonPath("$.userMessage", containsString("நான் செய்யக்கூடிய சில உதவிகள்")));

        // Step 5: After exit -> "தக்காளி price 42 ரூபாய்" -> UPDATE_PRODUCT_PRICE
        mockMvc.perform(post("/api/agent/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildFrontendPayload("தக்காளி price 42 ரூபாய்"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("UPDATE_PRODUCT_PRICE"))
                .andExpect(jsonPath("$.requiresConfirmation").value(true))
                .andExpect(jsonPath("$.userMessage", containsString("42.0/kg-ஆக")));
    }
}
