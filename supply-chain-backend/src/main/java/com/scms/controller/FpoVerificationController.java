package com.scms.controller;

import com.scms.entity.FpoDocument;
import com.scms.entity.Supplier;
import com.scms.repository.FpoDocumentRepository;
import com.scms.repository.SupplierRepository;
import com.scms.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class FpoVerificationController {

    private static final Logger log = LoggerFactory.getLogger(FpoVerificationController.class);

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB limit

    @Autowired
    private FpoDocumentRepository fpoDocumentRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private S3Service s3Service;

    @Value("${scms.kyc.upload-dir:uploads/}")
    private String uploadDir;

    private Path getStorageDirectory() throws IOException {
        Path path = Paths.get(uploadDir, "fpo-documents").toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
        if (!Files.isWritable(path)) {
            throw new IOException("Destination directory is not writable: " + path);
        }
        return path;
    }

    private String validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "File is empty.";
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return "File size exceeds the 10MB limit.";
        }

        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase() : "";

        if (!ext.equals(".pdf") && !ext.equals(".jpg") && !ext.equals(".jpeg") && !ext.equals(".png")) {
            return "Only PDF, JPG, and PNG files are accepted.";
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String lowerType = contentType.toLowerCase();
            if (!lowerType.contains("pdf") && !lowerType.contains("image") && !lowerType.contains("octet-stream")) {
                return "Only PDF, JPG, and PNG files are accepted.";
            }
        }

        return null; // Valid
    }

    // ─── SUPPLIER-FACING ──────────────────────────────────────────

    /**
     * Staged upload for FPO Certificate.
     * Processes and persists MultipartFile reliably without depending on Tomcat temp path.
     */
    @PostMapping("/api/supplier/fpo/upload")
    public ResponseEntity<?> uploadCertificateFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "supplierId", required = false) Integer supplierId) {
        try {
            String validationError = validateFile(file);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", validationError));
            }

            // Ensure destination storage exists and is writable
            Path storageDir = getStorageDirectory();

            // Read MultipartFile bytes immediately into memory/stream
            byte[] bytes = file.getBytes();
            if (bytes == null || bytes.length == 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "File is empty."));
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "certificate.pdf";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase() : ".pdf";
            String uniqueName = UUID.randomUUID().toString() + ext;

            // Persist reliably to local destination storage
            Path destinationFile = storageDir.resolve(uniqueName);
            Files.write(destinationFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String s3Key = "fpo-documents/" + uniqueName;
            try {
                s3Service.uploadFile(s3Key, bytes, file.getContentType());
            } catch (Exception s3Ex) {
                log.warn("S3 upload unavailable or not configured. Stored locally at: {}", destinationFile, s3Ex);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Certificate uploaded successfully",
                    "filePath", s3Key,
                    "originalFileName", originalName,
                    "fileSize", file.getSize(),
                    "fileType", ext.replace(".", "").toUpperCase()
            ));
        } catch (Exception e) {
            log.error("FPO certificate upload error", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "We couldn't upload your certificate. Please try again."
            ));
        }
    }

    /**
     * Final submission of FPO certificate for admin verification after successful upload.
     */
    @PostMapping("/api/supplier/fpo/submit-verification")
    @Transactional
    public ResponseEntity<?> submitFpoVerification(@RequestBody Map<String, Object> body) {
        try {
            Object sIdObj = body.get("supplierId");
            if (sIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Supplier ID is required."));
            }
            int supplierId = Integer.parseInt(sIdObj.toString());

            String filePath = (String) body.get("filePath");
            String originalName = (String) body.get("originalFileName");

            if (filePath == null || filePath.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Please upload a certificate first."));
            }

            Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
            if (supplier == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Supplier account not found."));
            }

            boolean isFpo = "FPO".equalsIgnoreCase(supplier.getSupplierType())
                    || "FPO_MEMBER".equalsIgnoreCase(supplier.getSupplierType())
                    || Boolean.TRUE.equals(supplier.getIsFpoMember());
            if (!isFpo) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Only FPO accounts can upload share certificates."));
            }

            FpoDocument doc = new FpoDocument();
            doc.setSupplierId(supplierId);
            doc.setDocumentUrl(filePath);
            doc.setDocumentType("FPO_SHARE_CERTIFICATE");
            doc.setOriginalFileName(originalName != null ? originalName : "FPO_Share_Certificate");
            doc.setVerificationStatus("PENDING");
            doc.setUploadedAt(LocalDateTime.now());
            fpoDocumentRepository.save(doc);

            supplier.setVerificationTier("FPO_PENDING");
            supplierRepository.save(supplier);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "FPO Share Certificate submitted successfully! Awaiting admin verification.",
                    "documentId", doc.getId(),
                    "verificationTier", "FPO_PENDING"
            ));
        } catch (Exception e) {
            log.error("Failed to submit FPO certificate for verification", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "We couldn't submit your certificate for verification. Please try again."
            ));
        }
    }

    /**
     * Upload FPO Share Certificate (Unified Endpoint).
     * Fully validates file, handles storage safely without Tomcat temp dependency,
     * and sanitizes error responses.
     */
    @PostMapping("/api/supplier/fpo/upload-certificate")
    @Transactional
    public ResponseEntity<?> uploadFpoCertificate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("supplierId") int supplierId) {
        try {
            String validationError = validateFile(file);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(Map.of("error", validationError));
            }

            Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
            if (supplier == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Supplier not found."));
            }

            boolean isFpo = "FPO".equalsIgnoreCase(supplier.getSupplierType())
                    || "FPO_MEMBER".equalsIgnoreCase(supplier.getSupplierType())
                    || Boolean.TRUE.equals(supplier.getIsFpoMember());
            if (!isFpo) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only FPO accounts can upload share certificates."));
            }

            // Ensure destination storage exists and is writable
            Path storageDir = getStorageDirectory();

            // Read MultipartFile bytes immediately into memory/stream
            byte[] bytes = file.getBytes();
            if (bytes == null || bytes.length == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "certificate.pdf";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase() : ".pdf";
            String uniqueName = UUID.randomUUID().toString() + ext;

            // Persist reliably to local destination storage
            Path destinationFile = storageDir.resolve(uniqueName);
            Files.write(destinationFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String s3Key = "fpo-documents/" + uniqueName;
            try {
                s3Service.uploadFile(s3Key, bytes, file.getContentType());
            } catch (Exception s3Ex) {
                log.warn("S3 upload unavailable or not configured. Retaining file in local storage: {}", destinationFile, s3Ex);
            }

            // Create FpoDocument record
            FpoDocument doc = new FpoDocument();
            doc.setSupplierId(supplierId);
            doc.setDocumentUrl(s3Key);
            doc.setDocumentType("FPO_SHARE_CERTIFICATE");
            doc.setOriginalFileName(originalName);
            doc.setVerificationStatus("PENDING");
            doc.setUploadedAt(LocalDateTime.now());
            fpoDocumentRepository.save(doc);

            // Update supplier verification tier to FPO_PENDING
            supplier.setVerificationTier("FPO_PENDING");
            supplierRepository.save(supplier);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "FPO Share Certificate uploaded successfully. Awaiting admin verification.",
                    "documentId", doc.getId(),
                    "filePath", s3Key
            ));
        } catch (Exception e) {
            log.error("FPO certificate upload failed with internal error", e);
            return ResponseEntity.status(500).body(Map.of("error", "We couldn't upload your certificate. Please try again."));
        }
    }

    /**
     * View/stream certificate file directly in the browser (PDF/image preview).
     * Works with both local disk storage and S3 storage.
     */
    @GetMapping({"/api/supplier/fpo/view-file", "/api/admin/fpo-verifications/view-file"})
    public ResponseEntity<?> viewCertificateFile(@RequestParam("key") String key) {
        try {
            if (key == null || key.isBlank()) {
                return ResponseEntity.badRequest().body("Key is required.");
            }

            // Clean up key
            String searchKey = key.trim();
            String filename = new File(searchKey).getName();
            Path storageDir = getStorageDirectory();
            Path filePath = storageDir.resolve(filename).normalize();

            // If file doesn't exist directly by key or filename, check database for real documentUrl or originalFileName
            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                // Try to find in DB by exact documentUrl or originalFileName
                Optional<FpoDocument> docOpt = fpoDocumentRepository.findFirstByDocumentUrl(searchKey);
                if (docOpt.isEmpty() && !searchKey.startsWith("fpo-documents/")) {
                    docOpt = fpoDocumentRepository.findFirstByDocumentUrl("fpo-documents/" + searchKey);
                }
                if (docOpt.isEmpty()) {
                    docOpt = fpoDocumentRepository.findFirstByOriginalFileNameOrderByUploadedAtDesc(filename);
                }

                if (docOpt.isPresent()) {
                    String realUrl = docOpt.get().getDocumentUrl();
                    if (realUrl != null && !realUrl.isBlank()) {
                        String realFilename = new File(realUrl).getName();
                        Path resolvedPath = storageDir.resolve(realFilename).normalize();
                        if (Files.exists(resolvedPath) && Files.isReadable(resolvedPath)) {
                            filePath = resolvedPath;
                            filename = realFilename;
                        }
                    }
                }
            }

            // 1. Try local disk storage
            if (Files.exists(filePath) && Files.isReadable(filePath)) {
                byte[] data = Files.readAllBytes(filePath);
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
                    else if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
                    else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
                    else contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
                }

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(data);
            }

            // 2. Try streaming from S3 if not found locally
            try {
                String s3Key = searchKey.contains("/") ? searchKey : "fpo-documents/" + filename;
                try (var is = s3Service.downloadFileStream(s3Key)) {
                    byte[] data = is.readAllBytes();
                    String contentType = filename.toLowerCase().endsWith(".pdf") ? "application/pdf"
                            : filename.toLowerCase().endsWith(".png") ? "image/png"
                            : filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg") ? "image/jpeg"
                            : MediaType.APPLICATION_OCTET_STREAM_VALUE;

                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_TYPE, contentType)
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                            .body(data);
                }
            } catch (Exception s3Ex) {
                log.warn("S3 download fallback also failed for key: {}", searchKey, s3Ex);
            }

            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to view certificate file: {}", key, e);
            return ResponseEntity.status(500).body("Error reading certificate file.");
        }
    }

    /**
     * Get FPO verification status for a supplier.
     */
    @GetMapping("/api/supplier/fpo/status/{supplierId}")
    public ResponseEntity<?> getFpoStatus(@PathVariable int supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
        if (supplier == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Supplier not found."));
        }

        List<FpoDocument> documents = fpoDocumentRepository.findBySupplierId(supplierId);

        List<Map<String, Object>> docList = documents.stream().map(doc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", doc.getId());
            m.put("documentType", doc.getDocumentType());
            m.put("originalFileName", doc.getOriginalFileName());
            m.put("verificationStatus", doc.getVerificationStatus());
            m.put("rejectionReason", doc.getRejectionReason());
            m.put("uploadedAt", doc.getUploadedAt());
            m.put("verifiedAt", doc.getVerifiedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "supplierId", supplierId,
                "supplierType", supplier.getSupplierType(),
                "isFpoMember", Boolean.TRUE.equals(supplier.getIsFpoMember()),
                "verificationTier", supplier.getVerificationTier(),
                "documents", docList
        ));
    }

    // ─── ADMIN-FACING ─────────────────────────────────────────────

    /**
     * List FPO verification requests (optionally filtered by status).
     */
    @GetMapping("/api/admin/fpo-verifications")
    public ResponseEntity<?> listFpoVerifications(
            @RequestParam(value = "status", required = false) String status) {

        List<FpoDocument> documents;
        if (status != null && !status.isBlank()) {
            documents = fpoDocumentRepository.findByVerificationStatus(status.toUpperCase());
        } else {
            documents = fpoDocumentRepository.findAll();
        }

        List<Map<String, Object>> result = documents.stream().map(doc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", doc.getId());
            m.put("supplierId", doc.getSupplierId());
            m.put("documentType", doc.getDocumentType());
            m.put("documentUrl", doc.getDocumentUrl());
            m.put("originalFileName", doc.getOriginalFileName());
            m.put("verificationStatus", doc.getVerificationStatus());
            m.put("rejectionReason", doc.getRejectionReason());
            m.put("uploadedAt", doc.getUploadedAt());
            m.put("verifiedAt", doc.getVerifiedAt());

            // Include supplier info
            supplierRepository.findById(doc.getSupplierId()).ifPresent(s -> {
                m.put("supplierName", s.getSupplierName());
                m.put("supplierEmail", s.getEmail());
                m.put("supplierPhone", s.getPhone());
            });
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Get a single FPO document detail for admin review.
     */
    @GetMapping("/api/admin/fpo-verifications/{id}")
    public ResponseEntity<?> getFpoVerificationDetail(@PathVariable Long id) {
        FpoDocument doc = fpoDocumentRepository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "FPO document not found."));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", doc.getId());
        result.put("supplierId", doc.getSupplierId());
        result.put("documentType", doc.getDocumentType());
        result.put("documentUrl", doc.getDocumentUrl());
        result.put("originalFileName", doc.getOriginalFileName());
        result.put("verificationStatus", doc.getVerificationStatus());
        result.put("rejectionReason", doc.getRejectionReason());
        result.put("uploadedAt", doc.getUploadedAt());
        result.put("verifiedAt", doc.getVerifiedAt());

        supplierRepository.findById(doc.getSupplierId()).ifPresent(s -> {
            result.put("supplierName", s.getSupplierName());
            result.put("supplierEmail", s.getEmail());
            result.put("supplierPhone", s.getPhone());
            result.put("supplierDistrict", s.getDistrict());
            result.put("supplierState", s.getState());
            result.put("verificationTier", s.getVerificationTier());
            result.put("supplierType", s.getSupplierType());
            result.put("isFpoMember", Boolean.TRUE.equals(s.getIsFpoMember()));
        });

        return ResponseEntity.ok(result);
    }

    /**
     * Admin: Approve or Reject an FPO certificate.
     */
    @PutMapping("/api/admin/fpo-verifications/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyFpoDocument(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        FpoDocument doc = fpoDocumentRepository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "FPO document not found."));
        }

        String action = (String) body.get("action"); // APPROVE or REJECT
        String reason = (String) body.get("reason");

        if (action == null || (!action.equalsIgnoreCase("APPROVE") && !action.equalsIgnoreCase("REJECT"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Action must be APPROVE or REJECT."));
        }

        Supplier supplier = supplierRepository.findById(doc.getSupplierId()).orElse(null);
        if (supplier == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Associated supplier not found."));
        }

        if ("APPROVE".equalsIgnoreCase(action)) {
            doc.setVerificationStatus("APPROVED");
            doc.setVerifiedAt(LocalDateTime.now());
            supplier.setVerificationTier("FPO_VERIFIED");
            supplier.setStatus("APPROVED");
        } else {
            doc.setVerificationStatus("REJECTED");
            doc.setRejectionReason(reason != null ? reason : "Rejected by admin.");
            doc.setVerifiedAt(LocalDateTime.now());
            // Reset tier so they can re-upload
            supplier.setVerificationTier("BASIC_REGISTERED");
        }

        fpoDocumentRepository.save(doc);
        supplierRepository.save(supplier);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "FPO document " + action.toLowerCase() + "d successfully.",
                "verificationStatus", doc.getVerificationStatus(),
                "verificationTier", supplier.getVerificationTier()
        ));
    }

    /**
     * Get preview URL for viewing an FPO document.
     * Returns a direct streamed view URL from the server so certificates always load cleanly in-browser.
     */
    @GetMapping("/api/admin/fpo-verifications/document-url")
    public ResponseEntity<?> getFpoDocumentUrl(@RequestParam("key") String key) {
        try {
            if (key == null || key.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Key is required."));
            }
            String serverStreamUrl = "/api/admin/fpo-verifications/view-file?key=" + URLEncoder.encode(key, StandardCharsets.UTF_8);
            return ResponseEntity.ok(Map.of("url", serverStreamUrl));
        } catch (Exception e) {
            log.error("Failed to generate document URL for key: {}", key, e);
            return ResponseEntity.status(500).body(Map.of("error", "Unable to view certificate at this time."));
        }
    }
}
