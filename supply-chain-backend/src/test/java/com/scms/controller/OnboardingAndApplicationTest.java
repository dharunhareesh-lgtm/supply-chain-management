package com.scms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scms.dto.PartnerRegistrationDTO;
import com.scms.entity.PartnerRegistrationRequest;
import com.scms.entity.Supplier;
import com.scms.entity.User;
import com.scms.entity.WarehouseLocation;
import com.scms.repository.NotificationRepository;
import com.scms.repository.PartnerRegistrationRequestRepository;
import com.scms.repository.SupplierRepository;
import com.scms.repository.TemporaryPasswordRepository;
import com.scms.repository.UserRepository;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.service.EmailNotificationService;
import com.scms.service.OtpService;
import com.scms.service.PartnerOnboardingService;
import com.scms.service.UserService;
import com.scms.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class OnboardingAndApplicationTest {

    private MockMvc userMockMvc;
    private MockMvc partnerMockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private WarehouseLocationRepository warehouseLocationRepository;

    @Mock
    private PartnerRegistrationRequestRepository partnerRequestRepository;

    @Mock
    private TemporaryPasswordRepository temporaryPasswordRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EmailNotificationService emailService;

    @Mock
    private OtpService otpService;

    @Mock
    private UserService userService;

    @Mock
    private JwtUtil jwtUtil;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private UserController userController;
    private AdminPartnerRequestController adminPartnerController;
    private PartnerOnboardingService partnerOnboardingService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        partnerOnboardingService = new PartnerOnboardingService();
        ReflectionTestUtils.setField(partnerOnboardingService, "partnerRequestRepository", partnerRequestRepository);
        ReflectionTestUtils.setField(partnerOnboardingService, "userRepository", userRepository);
        ReflectionTestUtils.setField(partnerOnboardingService, "warehouseLocationRepository", warehouseLocationRepository);
        ReflectionTestUtils.setField(partnerOnboardingService, "temporaryPasswordRepository", temporaryPasswordRepository);
        ReflectionTestUtils.setField(partnerOnboardingService, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(partnerOnboardingService, "emailService", emailService);
        ReflectionTestUtils.setField(partnerOnboardingService, "passwordEncoder", passwordEncoder);

        adminPartnerController = new AdminPartnerRequestController();
        ReflectionTestUtils.setField(adminPartnerController, "partnerOnboardingService", partnerOnboardingService);

        userController = new UserController();
        ReflectionTestUtils.setField(userController, "userRepository", userRepository);
        ReflectionTestUtils.setField(userController, "supplierRepository", supplierRepository);
        ReflectionTestUtils.setField(userController, "warehouseLocationRepository", warehouseLocationRepository);
        ReflectionTestUtils.setField(userController, "temporaryPasswordRepository", temporaryPasswordRepository);
        ReflectionTestUtils.setField(userController, "otpService", otpService);
        ReflectionTestUtils.setField(userController, "userService", userService);
        ReflectionTestUtils.setField(userController, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(userController, "jwtUtil", jwtUtil);

        userMockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        partnerMockMvc = MockMvcBuilders.standaloneSetup(adminPartnerController).build();
    }

    @Test
    public void testFarmerRegistration_IndividualFarmer() throws Exception {
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0);
            s.setSupplierId(101);
            return s;
        });
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> body = new HashMap<>();
        body.put("name", "Murugan K");
        body.put("phone", "9876543210");
        body.put("email", "murugan@example.com");
        body.put("password", "farmerPass123");
        body.put("isFpoMember", false);
        body.put("supplierType", "FARMER");

        userMockMvc.perform(post("/api/supplier/register-self")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.supplierType", is("FARMER")))
                .andExpect(jsonPath("$.isFpoMember", is(false)))
                .andExpect(jsonPath("$.username", is("murugan@example.com")));

        verify(supplierRepository).save(argThat(s ->
                "FARMER".equals(s.getSupplierType()) &&
                Boolean.FALSE.equals(s.getIsFpoMember()) &&
                "9876543210".equals(s.getPhone())
        ));
    }

    @Test
    public void testFarmerRegistration_FpoMember() throws Exception {
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0);
            s.setSupplierId(102);
            return s;
        });
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> body = new HashMap<>();
        body.put("name", "Selvi R");
        body.put("phone", "9123456780");
        body.put("email", "selvi@fpo.org");
        body.put("password", "fpoMember123");
        body.put("isFpoMember", true);

        userMockMvc.perform(post("/api/supplier/register-self")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.supplierType", is("FPO_MEMBER")))
                .andExpect(jsonPath("$.isFpoMember", is(true)))
                .andExpect(jsonPath("$.username", is("selvi@fpo.org")));

        verify(supplierRepository).save(argThat(s ->
                "FPO_MEMBER".equals(s.getSupplierType()) &&
                Boolean.TRUE.equals(s.getIsFpoMember())
        ));
    }

    @Test
    public void testWarehousePartnerRegistration_ServicePersistsCapacity() {
        PartnerRegistrationDTO dto = new PartnerRegistrationDTO();
        dto.setOrganizationName("Green Valley Cold Storage");
        dto.setContactPerson("Sundaram K");
        dto.setEmail("sundaram@greenvalley.com");
        dto.setPhone("9840123456");
        dto.setRoleRequested("Warehouse");
        dto.setDistrict("Coimbatore");
        dto.setState("Tamil Nadu");
        dto.setAddress("Industrial Estate, Pollachi Road");
        dto.setTotalCapacity(5000.0);
        dto.setColdStorageAvailable(true);
        dto.setColdStorageCapacity(1500.0);

        when(partnerRequestRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(partnerRequestRepository.save(any(PartnerRegistrationRequest.class))).thenAnswer(inv -> {
            PartnerRegistrationRequest req = inv.getArgument(0);
            req.setId(55L);
            req.prePersist();
            return req;
        });

        Map<String, Object> result = partnerOnboardingService.submitRegistration(dto);

        assertNotNull(result);
        assertEquals(true, result.get("success"));
        assertNotNull(result.get("requestNumber"));

        verify(partnerRequestRepository).save(argThat(saved ->
                "Warehouse".equals(saved.getRoleRequested()) &&
                Double.valueOf(5000.0).equals(saved.getTotalCapacity()) &&
                Boolean.TRUE.equals(saved.getColdStorageAvailable()) &&
                Double.valueOf(1500.0).equals(saved.getColdStorageCapacity()) &&
                "PENDING".equals(saved.getStatus())
        ));
    }

    @Test
    public void testWarehouseApproval_CreatesLocationWithCapacity() {
        PartnerRegistrationRequest req = new PartnerRegistrationRequest();
        req.setId(55L);
        req.setOrganizationName("Green Valley Cold Storage");
        req.setContactPerson("Sundaram K");
        req.setEmail("sundaram@greenvalley.com");
        req.setPhone("9840123456");
        req.setRoleRequested("Warehouse");
        req.setState("Tamil Nadu");
        req.setDistrict("Coimbatore");
        req.setAddress("Industrial Estate");
        req.setTotalCapacity(5000.0);
        req.setColdStorageAvailable(true);
        req.setColdStorageCapacity(1500.0);
        req.setStatus("PENDING");

        when(partnerRequestRepository.findById(55L)).thenReturn(Optional.of(req));
        when(userRepository.findByUsername("sundaram@greenvalley.com")).thenReturn(null);
        when(warehouseLocationRepository.save(any(WarehouseLocation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        partnerOnboardingService.approveRequest(55L, "admin@scms.com", "Approved after site inspection.");

        assertEquals("APPROVED", req.getStatus());
        verify(warehouseLocationRepository).save(argThat(w ->
                "Green Valley Cold Storage".equals(w.getWarehouseName()) &&
                "Sundaram K".equals(w.getManagerName()) &&
                Double.valueOf(5000.0).equals(w.getTotalCapacity()) &&
                Boolean.TRUE.equals(w.getColdStorageAvailable()) &&
                Double.valueOf(1500.0).equals(w.getColdStorageCapacity())
        ));
        verify(userRepository).save(argThat(u ->
                "WAREHOUSE".equals(u.getRole()) &&
                u.isMustChangePassword()
        ));
        verify(emailService).sendPartnerApprovalEmail(eq("sundaram@greenvalley.com"), anyString(), anyString(), anyString(), any());
    }

    @Test
    public void testAdminRoleFiltering_WarehouseAndLogistics() throws Exception {
        PartnerRegistrationRequest whReq = new PartnerRegistrationRequest();
        whReq.setId(10L);
        whReq.setOrganizationName("Alpha Agro Warehousing");
        whReq.setRoleRequested("Warehouse");
        whReq.setStatus("PENDING");

        when(partnerRequestRepository.findByRoleRequestedIn(anyList()))
                .thenReturn(List.of(whReq));
        when(partnerRequestRepository.countByRoleRequestedInAndStatus(anyList(), eq("PENDING")))
                .thenReturn(1L);

        partnerMockMvc.perform(get("/api/admin/partner-requests")
                        .param("role", "warehouse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].organizationName", is("Alpha Agro Warehousing")));

        partnerMockMvc.perform(get("/api/admin/partner-requests/counts")
                        .param("role", "warehouse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.PENDING", is(1)));
    }
}
