package com.scms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scms.entity.FpoDocument;
import com.scms.entity.Supplier;
import com.scms.repository.FpoDocumentRepository;
import com.scms.repository.SupplierRepository;
import com.scms.service.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class FpoVerificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private FpoDocumentRepository fpoDocumentRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private S3Service s3Service;

    private FpoVerificationController controller;

    private Supplier fpoSupplier;
    private Supplier farmerSupplier;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        controller = new FpoVerificationController();
        ReflectionTestUtils.setField(controller, "fpoDocumentRepository", fpoDocumentRepository);
        ReflectionTestUtils.setField(controller, "supplierRepository", supplierRepository);
        ReflectionTestUtils.setField(controller, "s3Service", s3Service);
        ReflectionTestUtils.setField(controller, "uploadDir", "target/test-uploads/");

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        // Create test upload directory
        new File("target/test-uploads/").mkdirs();

        fpoSupplier = new Supplier();
        fpoSupplier.setSupplierId(101);
        fpoSupplier.setSupplierName("Green Valley FPO");
        fpoSupplier.setEmail("contact@greenvalleyfpo.org");
        fpoSupplier.setPhone("9876543210");
        fpoSupplier.setSupplierType("FPO");
        fpoSupplier.setVerificationTier("BASIC_REGISTERED");

        farmerSupplier = new Supplier();
        farmerSupplier.setSupplierId(202);
        farmerSupplier.setSupplierName("Ramu Farmer");
        farmerSupplier.setEmail("ramu@farmer.com");
        farmerSupplier.setPhone("9123456780");
        farmerSupplier.setSupplierType("FARMER");
        farmerSupplier.setVerificationTier("BASIC_REGISTERED");
    }

    @Test
    public void testUploadFpoCertificate_Success() throws Exception {
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));
        when(fpoDocumentRepository.save(any(FpoDocument.class))).thenAnswer(invocation -> {
            FpoDocument doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "share_certificate.pdf",
                "application/pdf",
                "PDF certificate content".getBytes()
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload-certificate")
                        .file(file)
                        .param("supplierId", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("uploaded successfully")))
                .andExpect(jsonPath("$.documentId", is(1)));

        verify(s3Service).uploadFile(org.mockito.ArgumentMatchers.startsWith("fpo-documents/"), any(byte[].class), eq("application/pdf"));
        verify(supplierRepository).save(argThat(s -> "FPO_PENDING".equals(s.getVerificationTier())));
    }

    @Test
    public void testUploadFpoCertificate_RejectsNonFpoSupplier() throws Exception {
        when(supplierRepository.findById(202)).thenReturn(Optional.of(farmerSupplier));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                "content".getBytes()
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload-certificate")
                        .file(file)
                        .param("supplierId", "202"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Only FPO accounts can upload share certificates")));

        verifyNoInteractions(s3Service);
    }

    @Test
    public void testUploadFpoCertificate_RejectsInvalidFileType() throws Exception {
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "binary content".getBytes()
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload-certificate")
                        .file(file)
                        .param("supplierId", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Only PDF, JPG, and PNG files are accepted")));

        verifyNoInteractions(s3Service);
    }

    @Test
    public void testGetFpoStatus_Success() throws Exception {
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));

        FpoDocument doc = new FpoDocument();
        doc.setId(1L);
        doc.setSupplierId(101);
        doc.setOriginalFileName("fpo_cert.pdf");
        doc.setVerificationStatus("PENDING");
        doc.setUploadedAt(LocalDateTime.now());

        when(fpoDocumentRepository.findBySupplierId(101)).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/supplier/fpo/status/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierId", is(101)))
                .andExpect(jsonPath("$.supplierType", is("FPO")))
                .andExpect(jsonPath("$.documents", hasSize(1)))
                .andExpect(jsonPath("$.documents[0].originalFileName", is("fpo_cert.pdf")))
                .andExpect(jsonPath("$.documents[0].verificationStatus", is("PENDING")));
    }

    @Test
    public void testListFpoVerifications_Admin() throws Exception {
        FpoDocument doc = new FpoDocument();
        doc.setId(1L);
        doc.setSupplierId(101);
        doc.setOriginalFileName("cert.pdf");
        doc.setVerificationStatus("PENDING");
        doc.setUploadedAt(LocalDateTime.now());

        when(fpoDocumentRepository.findByVerificationStatus("PENDING")).thenReturn(List.of(doc));
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));

        mockMvc.perform(get("/api/admin/fpo-verifications?status=PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].supplierName", is("Green Valley FPO")))
                .andExpect(jsonPath("$[0].verificationStatus", is("PENDING")));
    }

    @Test
    public void testVerifyFpoDocument_Approve() throws Exception {
        FpoDocument doc = new FpoDocument();
        doc.setId(1L);
        doc.setSupplierId(101);
        doc.setVerificationStatus("PENDING");

        fpoSupplier.setVerificationTier("FPO_PENDING");

        when(fpoDocumentRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));

        Map<String, Object> body = Map.of("action", "APPROVE");

        mockMvc.perform(put("/api/admin/fpo-verifications/1/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.verificationStatus", is("APPROVED")))
                .andExpect(jsonPath("$.verificationTier", is("FPO_VERIFIED")));

        verify(supplierRepository).save(argThat(s -> "FPO_VERIFIED".equals(s.getVerificationTier())));
        verify(fpoDocumentRepository).save(argThat(d -> "APPROVED".equals(d.getVerificationStatus())));
    }

    @Test
    public void testVerifyFpoDocument_Reject() throws Exception {
        FpoDocument doc = new FpoDocument();
        doc.setId(1L);
        doc.setSupplierId(101);
        doc.setVerificationStatus("PENDING");

        fpoSupplier.setVerificationTier("FPO_PENDING");

        when(fpoDocumentRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));

        Map<String, Object> body = Map.of(
                "action", "REJECT",
                "reason", "Document blurry, unreadable signature"
        );

        mockMvc.perform(put("/api/admin/fpo-verifications/1/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.verificationStatus", is("REJECTED")))
                .andExpect(jsonPath("$.verificationTier", is("BASIC_REGISTERED")));

        verify(supplierRepository).save(argThat(s -> "BASIC_REGISTERED".equals(s.getVerificationTier())));
        verify(fpoDocumentRepository).save(argThat(d -> "REJECTED".equals(d.getVerificationStatus()) &&
                "Document blurry, unreadable signature".equals(d.getRejectionReason())));
    }

    @Test
    public void testGetFpoDocumentUrl() throws Exception {
        when(s3Service.generatePresignedUrl("fpo-documents/uuid.pdf", 15))
                .thenReturn("https://s3.amazonaws.com/bucket/fpo-documents/uuid.pdf?presigned=true");

        mockMvc.perform(get("/api/admin/fpo-verifications/document-url?key=fpo-documents/uuid.pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url", containsString("https://s3.amazonaws.com/bucket/")));
    }

    @Test
    public void testUploadFpoCertificate_RejectsFileOver10MB() throws Exception {
        byte[] largeBytes = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large_cert.pdf",
                "application/pdf",
                largeBytes
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload-certificate")
                        .file(largeFile)
                        .param("supplierId", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("File size exceeds the 10MB limit")));
    }

    @Test
    public void testStagedUpload_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                "certificate content".getBytes()
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload")
                        .file(file)
                        .param("supplierId", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Certificate uploaded successfully")))
                .andExpect(jsonPath("$.filePath", org.hamcrest.Matchers.startsWith("fpo-documents/")))
                .andExpect(jsonPath("$.originalFileName", is("certificate.pdf")));
    }

    @Test
    public void testSubmitFpoVerification_Success() throws Exception {
        when(supplierRepository.findById(101)).thenReturn(Optional.of(fpoSupplier));
        when(fpoDocumentRepository.save(any(FpoDocument.class))).thenAnswer(invocation -> {
            FpoDocument doc = invocation.getArgument(0);
            doc.setId(5L);
            return doc;
        });

        Map<String, Object> body = Map.of(
                "supplierId", 101,
                "filePath", "fpo-documents/test-uuid.pdf",
                "originalFileName", "my_share_certificate.pdf"
        );

        mockMvc.perform(post("/api/supplier/fpo/submit-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.documentId", is(5)))
                .andExpect(jsonPath("$.verificationTier", is("FPO_PENDING")));

        verify(supplierRepository).save(argThat(s -> "FPO_PENDING".equals(s.getVerificationTier())));
    }

    @Test
    public void testUploadFpoCertificate_SanitizesExceptionsWithoutLeakingStackTraces() throws Exception {
        when(supplierRepository.findById(101)).thenThrow(new RuntimeException("Simulated internal DB failure"));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                "content".getBytes()
        );

        mockMvc.perform(multipart("/api/supplier/fpo/upload-certificate")
                        .file(file)
                        .param("supplierId", "101"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error", is("We couldn't upload your certificate. Please try again.")))
                .andExpect(jsonPath("$.error", not(containsString("RuntimeException"))))
                .andExpect(jsonPath("$.error", not(containsString("Simulated internal DB failure"))));
    }
}
