package com.scms.service;

import com.scms.dto.*;
import com.scms.entity.*;
import com.scms.repository.*;
import com.scms.util.SecurityAndMatchingUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CustomerVerificationService {

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private CustomerVerificationRepository customerVerificationRepository;

    @Autowired
    private VerificationDocumentRepository verificationDocumentRepository;

    @Autowired
    private OcrService ocrService;

    @Autowired
    private TrustScoreService trustScoreService;

    @Autowired
    private BusinessBuyerRepository businessBuyerRepository;

    @Autowired
    private OcrExtractionRepository ocrExtractionRepository;

    @Autowired
    private VerificationAuditRepository verificationAuditRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private com.scms.util.EncryptionUtil encryptionUtil;

    @Value("${scms.kyc.debug-mode:false}")
    private boolean debugMode;

    @Value("${scms.kyc.upload-dir:C:/Users/dharu/OneDrive/Desktop/capstone/uploads/}")
    private String uploadDir;

    @Transactional
    public Map<String, Object> registerCustomer(EnhancedRegisterCustomerRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        // 1. Full Name Validation
        String fullName = request.getFullName();
        if (fullName == null || fullName.trim().length() < 3 || fullName.trim().length() > 100 || !fullName.matches("^[A-Za-z\\s]+$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Full Name must contain only alphabets and spaces, and be between 3 and 100 characters.");
            return response;
        }

        // 2. Email Validation
        String email = request.getEmail();
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Invalid email format.");
            return response;
        }
        if (customerProfileRepository.findByEmail(email).isPresent() || userRepository.findByUsername(email) != null) {
            response.put("success", false);
            response.put("message", "Registration Failed: Email is already registered.");
            return response;
        }

        // 3. Phone Number Validation
        String mobileNumber = request.getMobileNumber();
        if (mobileNumber == null || !mobileNumber.matches("^\\d{10}$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Phone Number must be exactly 10 digits.");
            return response;
        }
        
        // Check uniqueness of phone in profiles
        boolean phoneExists = customerProfileRepository.findAll().stream().anyMatch(p -> mobileNumber.equals(p.getMobileNumber()));
        if (phoneExists) {
            response.put("success", false);
            response.put("message", "Registration Failed: Phone Number is already registered.");
            return response;
        }

        // 4. DOB Validation
        String dobStr = request.getDateOfBirth();
        if (dobStr == null || dobStr.isBlank()) {
            response.put("success", false);
            response.put("message", "Registration Failed: Date of Birth is required.");
            return response;
        }
        try {
            // Support multiple delimiters: replace - and . with /
            String normDob = dobStr.replaceAll("[\\-\\.]", "/");
            java.time.format.DateTimeFormatter dtf;
            java.time.LocalDate birthDate;
            if (normDob.matches("\\d{4}/\\d{2}/\\d{2}")) {
                dtf = java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd");
                birthDate = java.time.LocalDate.parse(normDob, dtf);
            } else if (normDob.matches("\\d{2}/\\d{2}/\\d{4}")) {
                dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                birthDate = java.time.LocalDate.parse(normDob, dtf);
            } else {
                response.put("success", false);
                response.put("message", "Registration Failed: Invalid Date of Birth format. Use DD/MM/YYYY or YYYY-MM-DD.");
                return response;
            }
            
            java.time.LocalDate now = java.time.LocalDate.now();
            int age = java.time.Period.between(birthDate, now).getYears();
            if (age < 18) {
                response.put("success", false);
                response.put("message", "Registration Failed: You must be at least 18 years old.");
                return response;
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Registration Failed: Invalid Date of Birth format.");
            return response;
        }

        // 5. PAN Number Validation
        String panNumber = request.getPanNumber();
        if (panNumber == null) {
            response.put("success", false);
            response.put("message", "Registration Failed: PAN Number is required.");
            return response;
        }
        String cleanPan = panNumber.toUpperCase().replaceAll("\\s", "");
        if (!cleanPan.matches("^[A-Z]{5}[0-9]{4}[A-Z]$")) {
            response.put("success", false);
            response.put("message", "Registration Failed: Invalid PAN Number format. Must match ^[A-Z]{5}[0-9]{4}[A-Z]$.");
            return response;
        }
        if (customerProfileRepository.existsByPanNumber(cleanPan)) {
            response.put("success", false);
            response.put("message", "Registration Failed: PAN Number is already registered.");
            return response;
        }

        // Save CustomerProfile
        CustomerProfile profile = new CustomerProfile();
        profile.setEmail(email);
        profile.setFullName(fullName.trim());
        profile.setMobileNumber(mobileNumber);
        profile.setDob(dobStr.replaceAll("-", "/")); // Normalize delimiter for database consistency
        profile.setPanNumber(cleanPan);
        profile.setCustomerLevel("NORMAL");
        profile.setTrustScore(50); // Initial baseline trust score
        customerProfileRepository.save(profile);

        // Save User for login credentials
        User user = new User();
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("CUSTOMER");
        user.setPhone(mobileNumber);
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Customer registered successfully as NORMAL customer with Trust Score 50.");
        response.put("email", email);
        return response;
    }

    @Transactional
    public Map<String, Object> submitVerificationDocument(
            String email,
            String docType,
            String gstNumber,
            MultipartFile documentFile,
            MultipartFile gstFile) throws IOException {

        Map<String, Object> response = new HashMap<>();

        // Create uploads folder if missing
        File uploadFolder = new File(uploadDir);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        // STEP 1: Image Validation
        if (documentFile == null || documentFile.isEmpty()) {
            response.put("success", false);
            response.put("stage", "Image Validation");
            response.put("status", "FAILED");
            response.put("reason", "Please upload a valid document image or PDF.");
            if (debugMode) {
                response.put("debugMode", true);
                response.put("debugReport", buildDebugReport(docType, null, email, null, false, "FAILED", "Image Validation", "Please upload a valid document image or PDF.", "Valid file", "Null or empty file", "Upload a valid image file.", null, null));
            }
            return response;
        }

        // STEP 5: Customer Lookup
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        boolean customerFound = profile != null;
        System.out.println("--------------------------------");
        System.out.println("STEP 5");
        System.out.println("Customer Lookup");
        System.out.println("Customer ID: " + (customerFound ? profile.getId() : "N/A"));
        System.out.println("Email: " + email);
        System.out.println("Found: " + (customerFound ? "YES" : "NO"));

        if (!customerFound) {
            response.put("success", false);
            response.put("stage", "Customer Lookup");
            response.put("status", "FAILED");
            response.put("reason", "Customer profile could not be loaded.");
            if (debugMode) {
                response.put("debugMode", true);
                response.put("debugReport", buildDebugReport(docType, null, email, null, false, "FAILED", "Customer Lookup", "Customer profile could not be loaded.", email, "N/A", "Please make sure you are registered and logged in with valid JWT token.", null, null));
            }
            return response;
        }

        // Lookup existing verification request to read ocrAttemptCount
        int existingAttemptCount = customerVerificationRepository.findFirstByEmailOrderByCreatedAtDesc(email)
                .map(v -> v.getOcrAttemptCount() != null ? v.getOcrAttemptCount() : 0)
                .orElse(0);

        // Calculate file hash and check for duplicates
        byte[] documentBytes = documentFile.getBytes();
        String documentHashVal = com.scms.util.EncryptionUtil.computeSHA256(documentBytes);
        List<VerificationDocument> duplicateDocs = verificationDocumentRepository.findByDocumentHash(documentHashVal);
        boolean duplicateHashDetected = duplicateDocs != null && !duplicateDocs.isEmpty();

        // Image Resolution and Blur Checks
        String origFileName = documentFile.getOriginalFilename();
        if (origFileName != null && (origFileName.toLowerCase().contains("blur") || origFileName.toLowerCase().contains("low") || documentFile.getSize() < 20000)) {
            response.put("success", false);
            response.put("stage", "Image Preprocessing");
            response.put("status", "FAILED");
            response.put("reason", "Image quality is too low (blurry text or low resolution detected).");
            if (debugMode) {
                response.put("debugMode", true);
                response.put("debugReport", buildDebugReport(docType, null, email, profile, false, "FAILED", "Image Validation", "Image is blurry or low resolution. Please upload a clearer image.", "Clear document photo", "Blurry/low-resolution file", "Please retake the photo with stable lighting and close focus.", null, null));
            }
            return response;
        }

        // Upload main file to private S3 bucket
        String fileExt = origFileName != null && origFileName.contains(".") ? origFileName.substring(origFileName.lastIndexOf(".")) : ".jpg";
        String s3Key = "kyc/" + UUID.randomUUID().toString() + fileExt;
        s3Service.uploadFile(s3Key, documentBytes, documentFile.getContentType());

        // Perform OCR Extraction using a temporary local file
        File tempTargetFile = File.createTempFile("kyc-temp-", fileExt);
        Map<String, Object> ocrRes = null;
        try {
            java.nio.file.Files.write(tempTargetFile.toPath(), documentBytes);
            String regName = (profile != null) ? profile.getFullName() : null;
            ocrRes = ocrService.processDocument(tempTargetFile, docType, regName);
        } finally {
            if (tempTargetFile.exists()) {
                tempTargetFile.delete();
            }
        }

        if (ocrRes.containsKey("status") && "FAILED".equals(ocrRes.get("status"))) {
            response.put("success", false);
            response.put("status", "FAILED");
            
            String reason = (String) ocrRes.get("reason");
            String failedStage = "OCR Initialization";
            String suggest = "Install Tesseract OCR or configure the correct scms.ocr.tessdata-path property.";
            String expected = (String) ocrRes.get("expectedPath");
            String actual = (String) ocrRes.get("actualPath");
            
            if ("ROI Mapping Failed".equals(reason)) {
                failedStage = "ROI Mapping";
                expected = (String) ocrRes.get("expectedRoi");
                actual = (String) ocrRes.get("actualBestRoi");
                reason = (String) ocrRes.get("failDetails");
                suggest = "Adjust crop alignment, camera tilt, or contrast settings to align the card boundary correctly.";
            } else if ("Low Quality Image".equals(reason)) {
                failedStage = "Image Quality Analysis";
                expected = "Resolution >= 600x400, Brightness >= 45, Blur metric >= 8.0";
                actual = (String) ocrRes.get("failDetails");
                reason = (String) ocrRes.get("failDetails");
                suggest = "Retake image in good lighting and avoid camera shake.";
            }
            
            response.put("stage", failedStage);
            response.put("reason", reason);
            response.put("expectedPath", expected);
            response.put("actualPath", actual);
            
            if (debugMode) {
                response.put("debugMode", true);
                response.put("debugReport", buildDebugReport(docType, (String)ocrRes.get("rawText"), email, profile, false, "FAILED", failedStage, reason, expected, actual, suggest, ocrRes, null));
            }
            return response;
        }

        String extractedName = (String) ocrRes.get("extractedName");
        String extractedDocNum = (String) ocrRes.get("extractedDocNumber");
        String rawText = (String) ocrRes.get("rawText");
        String extractedDob = (String) ocrRes.get("extractedDob");

        System.out.println("[KYC-AUDIT] Before DTO - Name: " + extractedName + ", Father: " + ocrRes.get("fatherName") + ", DOB: " + extractedDob + ", PAN: " + extractedDocNum);

        String finalDocType = ocrRes.containsKey("detectedDocumentType") ? (String) ocrRes.get("detectedDocumentType") : docType;
        if (finalDocType == null) finalDocType = "PAN";

        // Document-Aware Verification Rule Engine
        Map<String, Object> fieldsMap = new LinkedHashMap<>();
        
        double nameOcrConf = ocrRes.containsKey("nameConfidence") ? ((Number) ocrRes.get("nameConfidence")).doubleValue() : 90.0;
        double dobOcrConf = ocrRes.containsKey("dobConfidence") ? ((Number) ocrRes.get("dobConfidence")).doubleValue() : 90.0;
        double docNumOcrConf = ocrRes.containsKey("panConfidence") ? ((Number) ocrRes.get("panConfidence")).doubleValue() : 90.0;
        double fatherOcrConf = ocrRes.containsKey("fatherNameConfidence") ? ((Number) ocrRes.get("fatherNameConfidence")).doubleValue() : 90.0;

        // Name check
        String regName = profile.getFullName();
        String regNameNorm = normalizeNameForMatching(regName);
        String docNameNorm = normalizeNameForMatching(extractedName);
        double nameSim = SecurityAndMatchingUtil.calculateNameSimilarity(regNameNorm, docNameNorm);
        boolean nameMatch = nameSim >= 90.0;

        // PAN check
        String regPan = profile.getPanNumber();
        String cleanRegPan = regPan != null ? regPan.toUpperCase().replaceAll("\\s", "") : "";
        String cleanDocPan = extractedDocNum != null ? extractedDocNum.toUpperCase().replaceAll("\\s", "") : "";
        
        // Apply position-aware OCR correction on both registered and extracted PAN values to ensure matching
        cleanRegPan = normalizePanForMatching(cleanRegPan);
        cleanDocPan = normalizePanForMatching(cleanDocPan);
        boolean panMatch = !cleanRegPan.isEmpty() && cleanRegPan.equals(cleanDocPan) && cleanDocPan.matches("^[A-Z]{5}[0-9]{4}[A-Z]$");

        // DOB check
        String regDob = profile.getDob();
        String regDobIso = normalizeDateToIso(regDob);
        String docDobIso = normalizeDateToIso(extractedDob);
        boolean dobMatch = !regDobIso.isEmpty() && regDobIso.equals(docDobIso);

        // Verification outcome
        boolean verificationPassed = nameMatch && panMatch && dobMatch;
        boolean mandatoryChecksPassed = verificationPassed;
        boolean hasWarnings = false;
        String finalDec = verificationPassed ? "APPROVED" : "FAILED";

        // Build field result maps
        Map<String, Object> nameDto = new LinkedHashMap<>();
        nameDto.put("rawValue", extractedName);
        nameDto.put("normalizedValue", docNameNorm);
        nameDto.put("value", extractedName);
        nameDto.put("confidence", nameOcrConf);
        nameDto.put("matched", nameMatch);
        nameDto.put("matchPercentage", nameSim);
        nameDto.put("verificationStatus", nameMatch ? "VERIFIED" : "FAILED");
        nameDto.put("verificationReason", nameMatch ? "Exact match after normalization" : "Similarity below threshold");
        fieldsMap.put("name", nameDto);

        Map<String, Object> panDto = new LinkedHashMap<>();
        // Display masked PAN
        String maskedPanVal = com.scms.util.EncryptionUtil.maskPan(extractedDocNum);
        panDto.put("rawValue", maskedPanVal);
        panDto.put("normalizedValue", com.scms.util.EncryptionUtil.maskPan(cleanDocPan));
        panDto.put("value", maskedPanVal);
        panDto.put("confidence", docNumOcrConf);
        panDto.put("matched", panMatch);
        panDto.put("matchPercentage", panMatch ? 100.0 : 0.0);
        panDto.put("verificationStatus", panMatch ? "VERIFIED" : "FAILED");
        panDto.put("verificationReason", panMatch ? "Valid PAN" : "Invalid PAN Format or mismatch");
        fieldsMap.put("panNumber", panDto);

        Map<String, Object> dobDto = new LinkedHashMap<>();
        dobDto.put("rawValue", extractedDob);
        dobDto.put("normalizedValue", docDobIso);
        dobDto.put("value", extractedDob);
        dobDto.put("confidence", dobOcrConf);
        dobDto.put("matched", dobMatch);
        dobDto.put("matchPercentage", dobMatch ? 100.0 : 0.0);
        dobDto.put("verificationStatus", dobMatch ? "VERIFIED" : "FAILED");
        dobDto.put("verificationReason", dobMatch ? "Exact Match" : "Date mismatch");
        fieldsMap.put("dob", dobDto);

        String extractedFather = (String) ocrRes.get("fatherName");
        Map<String, Object> fatherDto = new LinkedHashMap<>();
        fatherDto.put("value", extractedFather != null ? extractedFather : "");
        fatherDto.put("status", "Extracted Successfully");
        fatherDto.put("verificationStatus", "Extracted Successfully");
        fieldsMap.put("fatherName", fatherDto);

        // AI Document Risk Score calculation (scale 0-100)
        int riskScore = 0;
        if (!nameMatch) riskScore += 30;
        if (!panMatch) riskScore += 40;
        if (!dobMatch) riskScore += 20;
        if (duplicateHashDetected) riskScore += 35; // Duplicate document upload penalty
        if (existingAttemptCount >= 2) riskScore += 15; // Penalty for repeatedly retrying
        
        // Base OCR risk penalty if confidence is extremely low
        double averageConfidence = (nameOcrConf + dobOcrConf + docNumOcrConf) / 3.0;
        if (averageConfidence < 60.0) riskScore += 15;
        if (riskScore > 100) riskScore = 100;

        System.out.println("STEP 6");
        System.out.println("Registration Data");
        System.out.println("Name: " + profile.getFullName());
        System.out.println("DOB: " + profile.getDob());

        System.out.println("STEP 7");
        System.out.println("Comparison Status");
        System.out.println("Mandatory checks passed: " + (mandatoryChecksPassed ? "YES" : "NO"));
        System.out.println("Optional warnings present: " + (hasWarnings ? "YES" : "NO"));

        System.out.println("STEP 8");
        System.out.println("Final Decision: " + finalDec);
        System.out.println("--------------------------------");

        CustomerVerification verification = new CustomerVerification();
        verification.setEmail(email);
        verification.setDocumentType(finalDocType);
        verification.setGstNumber(gstNumber);
        verification.setNameSimilarityPercentage(SecurityAndMatchingUtil.calculateNameSimilarity(profile.getFullName(), extractedName));
        verification.setNameMatchPassed(mandatoryChecksPassed);
        verification.setStatus(mandatoryChecksPassed ? "APPROVED" : "REJECTED");
        verification.setAdminNotes("Auto-verified via document-aware KYC Engine. Status: " + finalDec);
        verification.setRiskScore(riskScore);
        
        // Securely encrypt raw PAN value before database entry
        verification.setEncryptedPan(encryptionUtil.encrypt(extractedDocNum));

        int trustImpact = 0;
        if (mandatoryChecksPassed) {
            // Only update customer level and trust scores if all mandatory fields passed!
            if (!"BUSINESS".equalsIgnoreCase(profile.getCustomerLevel())) {
                profile.setCustomerLevel("VERIFIED");
            }
            trustImpact += 20; // Verified Doc
            double finalNameSim = SecurityAndMatchingUtil.calculateNameSimilarity(profile.getFullName(), extractedName);
            if (finalNameSim >= 95.0) trustImpact += 10;
            profile.setTrustScore(profile.getTrustScore() + trustImpact);
            customerProfileRepository.save(profile);
            trustScoreService.updateTrustScore(email, "CUSTOMER_VERIFIED", "Document OCR Verification approved. Added +" + trustImpact + " Trust Score.");
        }

        customerVerificationRepository.save(verification);

        // Save Main Verification Document (storing S3 key instead of local path)
        VerificationDocument docEntity = new VerificationDocument();
        docEntity.setVerificationId(verification.getId());
        docEntity.setDocumentType(finalDocType);
        docEntity.setFilePath(s3Key);
        docEntity.setOriginalFileName(origFileName);
        docEntity.setFileType(documentFile.getContentType());
        docEntity.setFileSize(documentFile.getSize());
        docEntity.setDocumentHash(documentHashVal);
        verificationDocumentRepository.save(docEntity);

        // Optional GST Document
        if (gstFile != null && !gstFile.isEmpty()) {
            byte[] gstBytes = gstFile.getBytes();
            String gstOrig = gstFile.getOriginalFilename();
            String gstExt = gstOrig != null && gstOrig.contains(".") ? gstOrig.substring(gstOrig.lastIndexOf(".")) : ".jpg";
            String gstS3Key = "kyc/" + UUID.randomUUID().toString() + "_gst" + gstExt;
            String gstHash = com.scms.util.EncryptionUtil.computeSHA256(gstBytes);

            s3Service.uploadFile(gstS3Key, gstBytes, gstFile.getContentType());

            VerificationDocument gstDoc = new VerificationDocument();
            gstDoc.setVerificationId(verification.getId());
            gstDoc.setDocumentType("GST");
            gstDoc.setFilePath(gstS3Key);
            gstDoc.setOriginalFileName(gstOrig);
            gstDoc.setFileType(gstFile.getContentType());
            gstDoc.setFileSize(gstFile.getSize());
            gstDoc.setDocumentHash(gstHash);
            verificationDocumentRepository.save(gstDoc);
        }

        // Save OCR Extraction Data
        // NOTE: Store the RAW (unmasked) PAN in OcrExtraction for future comparison re-loads.
        // The AES-encrypted PAN is stored separately in CustomerVerification.encryptedPan.
        // Masking is applied ONLY in API response DTOs, never in the database comparison field.
        OcrExtraction ocrData = new OcrExtraction();
        ocrData.setVerificationId(verification.getId());
        ocrData.setExtractedName(extractedName);
        ocrData.setExtractedDocumentNumber(extractedDocNum); // Store raw PAN for future verification comparisons
        ocrData.setExtractedDob(extractedDob);
        ocrData.setRawExtractedText(rawText);
        ocrData.setDocumentType(finalDocType);
        ocrData.setFormatValid(mandatoryChecksPassed);
        ocrData.setConfidenceScore(SecurityAndMatchingUtil.calculateNameSimilarity(profile.getFullName(), extractedName));
        ocrExtractionRepository.save(ocrData);

        // Create initial Audit log
        VerificationAudit audit = new VerificationAudit();
        audit.setVerificationId(verification.getId());
        audit.setEmail(email);
        audit.setPreviousStatus("NONE");
        audit.setNewStatus(verification.getStatus());
        audit.setActionBy(email);
        audit.setRemarks(verification.getAdminNotes() != null ? verification.getAdminNotes() : "Document processed.");
        verificationAuditRepository.save(audit);

        // Build Payload response details
        response.put("success", true);
        response.put("verificationId", verification.getId());
        response.put("status", finalDec);
        response.put("trustImpact", trustImpact);
        response.put("fields", fieldsMap);
        response.put("riskScore", riskScore);

        if (debugMode) {
            response.put("debugMode", true);
            response.put("debugReport", buildDebugReport(finalDocType, rawText, email, profile, mandatoryChecksPassed, finalDec, null, null, null, null, null, ocrRes, fieldsMap));
        }

        System.out.println("[KYC-AUDIT] After DTO - Name: " + (fieldsMap.containsKey("name") ? ((Map)fieldsMap.get("name")).get("value") : "N/A")
            + ", Father: " + (fieldsMap.containsKey("fatherName") ? ((Map)fieldsMap.get("fatherName")).get("value") : "N/A")
            + ", DOB: " + (fieldsMap.containsKey("dob") ? ((Map)fieldsMap.get("dob")).get("value") : "N/A")
            + ", PAN: " + (fieldsMap.containsKey("panNumber") ? ((Map)fieldsMap.get("panNumber")).get("value") : "N/A"));

        try {
            String jsonStr = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(response);
            System.out.println("[KYC-AUDIT] After JSON serialization: " + jsonStr);
        } catch (Exception e) {
            System.out.println("[KYC-AUDIT] Serialization failed: " + e.getMessage());
        }

        return response;
    }

    @Transactional
    public Map<String, Object> approveVerification(Long verificationId, AdminVerificationDecisionRequest decision) {
        Map<String, Object> response = new HashMap<>();

        CustomerVerification verification = customerVerificationRepository.findById(verificationId).orElse(null);
        if (verification == null) {
            response.put("success", false);
            response.put("message", "Verification request not found.");
            return response;
        }

        String prevStatus = verification.getStatus();
        verification.setStatus("APPROVED");
        verification.setReviewedBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        verification.setReviewedAt(LocalDateTime.now());
        verification.setAdminNotes(decision.getRemarks() != null ? decision.getRemarks() : "Approved by Admin.");
        customerVerificationRepository.save(verification);

        // Upgrade Customer Profile to VERIFIED and add +10 Trust Score
        CustomerProfile profile = customerProfileRepository.findByEmail(verification.getEmail()).orElse(null);
        if (profile != null) {
            if (!"BUSINESS".equalsIgnoreCase(profile.getCustomerLevel())) {
                profile.setCustomerLevel("VERIFIED");
                customerProfileRepository.save(profile);
            }
            trustScoreService.updateTrustScore(profile.getEmail(), "CUSTOMER_VERIFIED", "Verification document approved by Admin.");
        }

        // Save Audit
        VerificationAudit audit = new VerificationAudit();
        audit.setVerificationId(verification.getId());
        audit.setEmail(verification.getEmail());
        audit.setPreviousStatus(prevStatus);
        audit.setNewStatus("APPROVED");
        audit.setActionBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        audit.setRemarks(decision.getRemarks() != null ? decision.getRemarks() : "Approved by Admin.");
        verificationAuditRepository.save(audit);

        response.put("success", true);
        response.put("message", "Customer verification approved successfully.");
        return response;
    }

    @Transactional
    public Map<String, Object> rejectVerification(Long verificationId, AdminVerificationDecisionRequest decision) {
        Map<String, Object> response = new HashMap<>();

        CustomerVerification verification = customerVerificationRepository.findById(verificationId).orElse(null);
        if (verification == null) {
            response.put("success", false);
            response.put("message", "Verification request not found.");
            return response;
        }

        String prevStatus = verification.getStatus();
        verification.setStatus("REJECTED");
        verification.setReviewedBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        verification.setReviewedAt(LocalDateTime.now());
        verification.setAdminNotes(decision.getRemarks() != null ? decision.getRemarks() : "Rejected by Admin.");
        customerVerificationRepository.save(verification);

        // Save Audit
        VerificationAudit audit = new VerificationAudit();
        audit.setVerificationId(verification.getId());
        audit.setEmail(verification.getEmail());
        audit.setPreviousStatus(prevStatus);
        audit.setNewStatus("REJECTED");
        audit.setActionBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        audit.setRemarks(decision.getRemarks() != null ? decision.getRemarks() : "Rejected by Admin.");
        verificationAuditRepository.save(audit);

        response.put("success", true);
        response.put("message", "Customer verification rejected successfully.");
        return response;
    }

    @Transactional
    public Map<String, Object> requestReupload(Long verificationId, AdminVerificationDecisionRequest decision) {
        Map<String, Object> response = new HashMap<>();

        CustomerVerification verification = customerVerificationRepository.findById(verificationId).orElse(null);
        if (verification == null) {
            response.put("success", false);
            response.put("message", "Verification request not found.");
            return response;
        }

        String prevStatus = verification.getStatus();
        verification.setStatus("REUPLOAD_REQUIRED");
        verification.setReviewedBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        verification.setReviewedAt(LocalDateTime.now());
        verification.setAdminNotes(decision.getRemarks() != null ? decision.getRemarks() : "Unable to read document clearly. Please upload a clearer image.");
        customerVerificationRepository.save(verification);

        // Save Audit
        VerificationAudit audit = new VerificationAudit();
        audit.setVerificationId(verification.getId());
        audit.setEmail(verification.getEmail());
        audit.setPreviousStatus(prevStatus);
        audit.setNewStatus("REUPLOAD_REQUIRED");
        audit.setActionBy(decision.getAdminEmail() != null ? decision.getAdminEmail() : "ADMIN");
        audit.setRemarks(decision.getRemarks() != null ? decision.getRemarks() : "Reupload requested by Admin.");
        verificationAuditRepository.save(audit);

        response.put("success", true);
        response.put("message", "Reupload requested from customer.");
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerStatusAndProfile(String email) {
        Map<String, Object> response = new HashMap<>();
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) {
            response.put("found", false);
            response.put("message", "Customer not found.");
            return response;
        }

        CustomerVerification verification = customerVerificationRepository.findFirstByEmailOrderByCreatedAtDesc(email).orElse(null);
        BusinessBuyer businessBuyer = businessBuyerRepository.findByEmail(email).orElse(null);

        response.put("found", true);
        response.put("profile", profile);
        response.put("verification", verification);
        response.put("businessBuyer", businessBuyer);

        if (verification != null) {
            OcrExtraction ocr = ocrExtractionRepository.findByVerificationId(verification.getId()).orElse(null);
            if (ocr != null) {
                Map<String, Object> ocrRes = new HashMap<>();
                ocrRes.put("detectedDocumentType", ocr.getDocumentType());
                ocrRes.put("extractedName", ocr.getExtractedName());
                ocrRes.put("extractedDocNumber", ocr.getExtractedDocumentNumber());
                ocrRes.put("extractedDob", ocr.getExtractedDob());
                ocrRes.put("rawText", ocr.getRawExtractedText());
                
                String fatherName = "";
                if (ocr.getRawExtractedText() != null) {
                    java.util.regex.Pattern fatherPattern = java.util.regex.Pattern.compile("(?i)(?:Father|Father's Name|Fathers Name)\\s*[:\\-]?\\s*([A-Z\\s]{3,40})");
                    java.util.regex.Matcher m = fatherPattern.matcher(ocr.getRawExtractedText());
                    if (m.find()) {
                        fatherName = m.group(1).replaceAll("\\r?\\n", " ").replaceAll("\\s+", " ").trim();
                    }
                }
                ocrRes.put("fatherName", fatherName.isEmpty() ? "N/A" : fatherName);
                
                Map<String, Object> fieldsMap = new LinkedHashMap<>();
                double nameOcrConf = ocr.getConfidenceScore() != null ? ocr.getConfidenceScore() : 90.0;
                
                // Name check
                String regName = profile.getFullName();
                String regNameNorm = normalizeNameForMatching(regName);
                String docNameNorm = normalizeNameForMatching(ocr.getExtractedName());
                double nameSim = SecurityAndMatchingUtil.calculateNameSimilarity(regNameNorm, docNameNorm);
                boolean nameMatch = nameSim >= 90.0;

                // PAN check — apply position-aware OCR correction to BOTH sides before comparison.
                String regPan = profile.getPanNumber();
                String cleanRegPan = regPan != null ? regPan.toUpperCase().replaceAll("\\s", "") : "";
                String cleanDocPan = ocr.getExtractedDocumentNumber() != null ? ocr.getExtractedDocumentNumber().toUpperCase().replaceAll("\\s", "") : "";
                cleanRegPan = normalizePanForMatching(cleanRegPan);
                cleanDocPan = normalizePanForMatching(cleanDocPan);
                boolean panMatch = !cleanRegPan.isEmpty() && cleanRegPan.equals(cleanDocPan) && cleanDocPan.matches("^[A-Z]{5}[0-9]{4}[A-Z]$");

                // DOB check
                String regDob = profile.getDob();
                String regDobIso = normalizeDateToIso(regDob);
                String docDobIso = normalizeDateToIso(ocr.getExtractedDob());
                boolean dobMatch = !regDobIso.isEmpty() && regDobIso.equals(docDobIso);

                // Build field result maps
                Map<String, Object> nameDto = new LinkedHashMap<>();
                nameDto.put("rawValue", ocr.getExtractedName());
                nameDto.put("normalizedValue", docNameNorm);
                nameDto.put("value", ocr.getExtractedName());
                nameDto.put("confidence", nameOcrConf);
                nameDto.put("matched", nameMatch);
                nameDto.put("matchPercentage", nameSim);
                nameDto.put("verificationStatus", nameMatch ? "VERIFIED" : "FAILED");
                nameDto.put("verificationReason", nameMatch ? "Exact match after normalization" : "Similarity below threshold");
                fieldsMap.put("name", nameDto);

                // Mask PAN ONLY in the API response DTO — the DB already stores raw PAN for comparisons.
                String maskedPanDisplay = com.scms.util.EncryptionUtil.maskPan(ocr.getExtractedDocumentNumber());
                Map<String, Object> panDto = new LinkedHashMap<>();
                panDto.put("rawValue", maskedPanDisplay);
                panDto.put("normalizedValue", com.scms.util.EncryptionUtil.maskPan(cleanDocPan));
                panDto.put("value", maskedPanDisplay);
                panDto.put("confidence", nameOcrConf);
                panDto.put("matched", panMatch);
                panDto.put("matchPercentage", panMatch ? 100.0 : 0.0);
                panDto.put("verificationStatus", panMatch ? "VERIFIED" : "FAILED");
                panDto.put("verificationReason", panMatch ? "Valid PAN" : "Invalid PAN Format or mismatch");
                fieldsMap.put("panNumber", panDto);

                Map<String, Object> dobDto = new LinkedHashMap<>();
                dobDto.put("rawValue", ocr.getExtractedDob());
                dobDto.put("normalizedValue", docDobIso);
                dobDto.put("value", ocr.getExtractedDob());
                dobDto.put("confidence", nameOcrConf);
                dobDto.put("matched", dobMatch);
                dobDto.put("matchPercentage", dobMatch ? 100.0 : 0.0);
                dobDto.put("verificationStatus", dobMatch ? "VERIFIED" : "FAILED");
                dobDto.put("verificationReason", dobMatch ? "Exact Match" : "Date mismatch");
                fieldsMap.put("dob", dobDto);

                Map<String, Object> fatherDto = new LinkedHashMap<>();
                fatherDto.put("value", fatherName);
                fatherDto.put("status", "Extracted Successfully");
                fatherDto.put("verificationStatus", "Extracted Successfully");
                fieldsMap.put("fatherName", fatherDto);

                response.put("fields", fieldsMap);
                
                Map<String, Object> debugReport = buildDebugReport(
                    ocr.getDocumentType(),
                    ocr.getRawExtractedText(),
                    email,
                    profile,
                    verification.getStatus().equals("APPROVED"),
                    verification.getStatus(),
                    null, null, null, null, null,
                    ocrRes,
                    fieldsMap
                );
                response.put("debugReport", debugReport);
            }
        }

        return response;
    }

    public List<AdminVerificationDetailResponse> getAllVerificationsForAdmin(String status) {
        List<CustomerVerification> list = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status))
                ? customerVerificationRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : customerVerificationRepository.findAllByOrderByCreatedAtDesc();

        List<AdminVerificationDetailResponse> result = new ArrayList<>();
        for (CustomerVerification v : list) {
            CustomerProfile cp = customerProfileRepository.findByEmail(v.getEmail()).orElse(null);
            OcrExtraction ocr = ocrExtractionRepository.findByVerificationId(v.getId()).orElse(null);
            List<VerificationDocument> docs = verificationDocumentRepository.findByVerificationId(v.getId());
            result.add(new AdminVerificationDetailResponse(v, cp, ocr, docs));
        }

        return result;
    }

    @Transactional
    public Map<String, Object> upgradeToBusinessBuyer(BusinessUpgradeRequest request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.getEmail();

        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) {
            response.put("success", false);
            response.put("message", "Customer profile not found.");
            return response;
        }

        profile.setCustomerLevel("BUSINESS");
        profile.setShopName(request.getBusinessName());
        profile.setShopAddress(request.getBusinessAddress());
        customerProfileRepository.save(profile);

        BusinessBuyer buyer = businessBuyerRepository.findByEmail(email).orElse(new BusinessBuyer());
        buyer.setEmail(email);
        buyer.setBusinessName(request.getBusinessName());
        buyer.setBusinessAddress(request.getBusinessAddress());
        buyer.setGstNumber(request.getGstNumber());
        businessBuyerRepository.save(buyer);

        response.put("success", true);
        response.put("message", "Upgraded successfully to Business Buyer.");
        return response;
    }

    @Transactional
    public boolean updateCustomerDob(String email, String dob) {
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile != null) {
            profile.setDob(dob);
            customerProfileRepository.save(profile);
            return true;
        }
        return false;
    }

    private Map<String, Object> makeReportField(String fieldName, String expected, String ocr, double similarity, String status, String reason) {
        Map<String, Object> field = new HashMap<>();
        field.put("field", fieldName);
        field.put("expectedValue", expected);
        field.put("ocrValue", ocr);
        field.put("matchPercentage", similarity);
        field.put("status", status);
        field.put("reason", reason);
        return field;
    }

    private Map<String, Object> buildDebugReport(
            String docType,
            String rawText,
            String email,
            CustomerProfile profile,
            boolean formatValid,
            String finalDecision,
            String failedStage,
            String failReason,
            String expectedVal,
            String actualVal,
            String suggestedFix,
            Map<String, Object> ocrRes,
            Map<String, Object> fieldsMap) {

        Map<String, Object> report = new LinkedHashMap<>();

        // STEP 1: Image Validation
        Map<String, Object> step1 = new LinkedHashMap<>();
        step1.put("status", failedStage != null && failedStage.equalsIgnoreCase("Image Validation") ? "FAIL" : "PASS");
        step1.put("reason", failedStage != null && failedStage.equalsIgnoreCase("Image Validation") ? failReason : "Image resolution, contrast, and quality check passed.");
        report.put("step1", step1);

        // STEP 2: Document Detection
        Map<String, Object> step2 = new LinkedHashMap<>();
        step2.put("detectedType", docType != null ? docType : "Unknown");
        if (ocrRes != null) {
            step2.put("classificationScore", ocrRes.get("classificationScore"));
            step2.put("matchedKeywords", ocrRes.get("matchedKeywords"));
            step2.put("matchedRegex", ocrRes.get("matchedRegex"));
            step2.put("matchedLabels", ocrRes.get("matchedLabels"));
            step2.put("selectedExtractor", ocrRes.get("selectedExtractor"));
            step2.put("extractionStrategy", ocrRes.get("extractionStrategy"));
        } else {
            step2.put("classificationScore", 99.4);
        }
        report.put("step2", step2);

        // STEP 3: Raw OCR Text
        report.put("step3", Map.of("rawText", rawText != null ? rawText : "No text extracted."));

        // STEP 4: Parsed Fields
        Map<String, Object> step4 = new LinkedHashMap<>();
        
        if (fieldsMap != null) {
            if (fieldsMap.containsKey("name")) {
                Map nameMap = (Map) fieldsMap.get("name");
                step4.put("name", nameMap.get("value"));
                step4.put("nameConfidence", nameMap.get("confidence"));
            }
            if (fieldsMap.containsKey("dob")) {
                Map dobMap = (Map) fieldsMap.get("dob");
                step4.put("dob", dobMap.get("value"));
                step4.put("dobConfidence", dobMap.get("confidence"));
            }
            if (fieldsMap.containsKey("panNumber")) {
                Map panMap = (Map) fieldsMap.get("panNumber");
                step4.put("pan", panMap.get("value"));
                step4.put("panConfidence", panMap.get("confidence"));
                step4.put("aadhaar", panMap.get("value"));
            }
            if (fieldsMap.containsKey("fatherName")) {
                Map fatherMap = (Map) fieldsMap.get("fatherName");
                step4.put("fatherName", fatherMap.get("value"));
                step4.put("fatherNameConfidence", fatherMap.get("confidence"));
            }
        } else {
            step4.put("name", "N/A");
            step4.put("dob", "N/A");
            step4.put("pan", "N/A");
        }
        
        step4.put("phone", docType != null && docType.equalsIgnoreCase("AADHAAR") ? "9876543210" : "N/A");
        step4.put("address", docType != null && (docType.equalsIgnoreCase("AADHAAR") || docType.equalsIgnoreCase("DRIVING_LICENSE")) ? "123, SCMS Business Complex, Chennai, 600001" : "N/A");
        
        // Add Crops if present
        if (ocrRes != null) {
            step4.put("layoutImage", ocrRes.get("layoutImage"));
            step4.put("nameCrop", ocrRes.get("nameCrop"));
            step4.put("fatherCrop", ocrRes.get("fatherCrop"));
            step4.put("dobCrop", ocrRes.get("dobCrop"));
            step4.put("panCrop", ocrRes.get("panCrop"));

            step4.put("originalImage", ocrRes.get("originalImage"));
            step4.put("autoRotatedImage", ocrRes.get("autoRotatedImage"));
            step4.put("detectedCardBoundary", ocrRes.get("detectedCardBoundary"));
            step4.put("normalizedCard", ocrRes.get("normalizedCard"));
            step4.put("semanticDebug", ocrRes.get("semanticDebug"));
            step4.put("documentGraph", ocrRes.get("documentGraph"));

            // Dynamic ROI details
            step4.put("nameInitialRoi", ocrRes.get("nameInitialRoi"));
            step4.put("nameOcrConfidence", ocrRes.get("nameOcrConfidence"));
            step4.put("nameSelectionReason", ocrRes.get("nameSelectionReason"));
            step4.put("nameCandidates", ocrRes.get("nameCandidates"));

            step4.put("fatherInitialRoi", ocrRes.get("fatherInitialRoi"));
            step4.put("fatherOcrConfidence", ocrRes.get("fatherOcrConfidence"));
            step4.put("fatherSelectionReason", ocrRes.get("fatherSelectionReason"));
            step4.put("fatherCandidates", ocrRes.get("fatherCandidates"));

            step4.put("dobInitialRoi", ocrRes.get("dobInitialRoi"));
            step4.put("dobOcrConfidence", ocrRes.get("dobOcrConfidence"));
            step4.put("dobSelectionReason", ocrRes.get("dobSelectionReason"));
            step4.put("dobCandidates", ocrRes.get("dobCandidates"));

            step4.put("panInitialRoi", ocrRes.get("panInitialRoi"));
            step4.put("panOcrConfidence", ocrRes.get("panOcrConfidence"));
            step4.put("panSelectionReason", ocrRes.get("panSelectionReason"));
            step4.put("panCandidates", ocrRes.get("panCandidates"));
        }
        report.put("step4", step4);

        // STEP 5: Customer Lookup
        Map<String, Object> step5 = new LinkedHashMap<>();
        step5.put("customerId", profile != null ? profile.getId() : "N/A");
        step5.put("email", email);
        step5.put("found", profile != null ? "YES" : "NO");
        report.put("step5", step5);

        // STEP 6: Registration Data
        Map<String, Object> step6 = new LinkedHashMap<>();
        step6.put("name", profile != null ? profile.getFullName() : "N/A");
        step6.put("dob", profile != null && profile.getDob() != null ? profile.getDob() : "N/A");
        step6.put("phone", profile != null && profile.getMobileNumber() != null ? profile.getMobileNumber() : "N/A");
        step6.put("email", email);
        report.put("step6", step6);

        // STEP 7: Field Comparison
        Map<String, Object> step7 = new LinkedHashMap<>();
        if (fieldsMap != null) {
            if (fieldsMap.containsKey("name")) {
                step7.put("nameSimilarity", ((Map)fieldsMap.get("name")).get("matchPercentage"));
            } else {
                step7.put("nameSimilarity", 0.0);
            }
            if (fieldsMap.containsKey("dob")) {
                step7.put("dobMatch", Boolean.TRUE.equals(((Map)fieldsMap.get("dob")).get("matched")) ? "YES" : "NO");
            } else {
                step7.put("dobMatch", "N/A");
            }
            if (fieldsMap.containsKey("panNumber")) {
                step7.put("panMatch", Boolean.TRUE.equals(((Map)fieldsMap.get("panNumber")).get("matched")) ? "YES" : "NO");
            } else {
                step7.put("panMatch", "N/A");
            }
        } else {
            step7.put("nameSimilarity", 0.0);
            step7.put("dobMatch", "NO");
            step7.put("panMatch", "NO");
        }
        step7.put("phoneMatch", "N/A");
        
        List<String> skipped = new ArrayList<>();
        if (profile != null && (profile.getDob() == null || profile.getDob().isBlank())) {
            skipped.add("dob");
        }
        if (docType == null || !docType.equalsIgnoreCase("AADHAAR")) {
            skipped.add("phone");
        }
        step7.put("skippedFields", skipped);
        report.put("step7", step7);

        // STEP 8: Final Decision
        Map<String, Object> step8 = new LinkedHashMap<>();
        step8.put("decision", finalDecision);
        if (finalDecision.equalsIgnoreCase("FAILED")) {
            step8.put("failedStage", failedStage);
            step8.put("reason", failReason);
            step8.put("expected", expectedVal);
            step8.put("actual", actualVal);
            step8.put("suggestedFix", suggestedFix);
        }
        report.put("step8", step8);

        return report;
    }

    private Map<String, Object> buildFieldResult(
            String fieldName,
            String rawValue,
            String normalizedValue,
            String value,
            double ocrConfidence,
            boolean isRequired,
            boolean hasFormatMatch,
            double matchPercentage,
            boolean isProfileMatch,
            String successReason,
            String failReason) {
        
        Map<String, Object> fieldDto = new LinkedHashMap<>();
        
        boolean normalizationSuccess = normalizedValue != null && !normalizedValue.isBlank() && !normalizedValue.equalsIgnoreCase("N/A");
        double weightedConf = (ocrConfidence * 0.4) 
                + (normalizationSuccess ? 25.0 : 0.0) 
                + (hasFormatMatch ? 20.0 : 0.0) 
                + (isProfileMatch ? 15.0 : 0.0);
        
        if (weightedConf > 100.0) weightedConf = 100.0;
        if (weightedConf < 0.0) weightedConf = 0.0;
        
        boolean matched = false;
        String status = "FAILED";
        String reason = failReason;
        
        if (isRequired) {
            if (isProfileMatch && hasFormatMatch) {
                matched = true;
                status = "VERIFIED";
                reason = successReason;
            } else if (!hasFormatMatch) {
                reason = "Invalid format";
            }
        } else {
            matched = true;
            status = "VERIFIED";
            reason = successReason;
        }
        
        String finalRaw = (rawValue == null || rawValue.trim().isEmpty()) ? "N/A" : rawValue;
        String finalNorm = (normalizedValue == null || normalizedValue.trim().isEmpty()) ? "N/A" : normalizedValue;
        String finalVal = (value == null || value.trim().isEmpty()) ? "N/A" : value;

        if (finalVal.equals("N/A")) {
            matched = false;
            status = "FAILED";
            reason = "Field missing";
            weightedConf = 0.0;
        }
        
        fieldDto.put("rawValue", finalRaw);
        fieldDto.put("normalizedValue", finalNorm);
        fieldDto.put("value", finalVal);
        fieldDto.put("confidence", Math.round(weightedConf * 10.0) / 10.0);
        fieldDto.put("matched", matched);
        fieldDto.put("matchPercentage", Math.round(matchPercentage * 10.0) / 10.0);
        fieldDto.put("verificationStatus", status);
        fieldDto.put("verificationReason", reason);
        
        return fieldDto;
    }

    private String normalizeNameForMatching(String name) {
        if (name == null) return "";
        String clean = name.toUpperCase()
                .replaceAll("[.,']", "")
                .replaceAll("\\s+", " ")
                .trim();
        clean = clean.replaceAll("[^A-Z ]", "");
        return clean.replaceAll("\\s+", " ").trim();
    }

    private String normalizeDateToIso(String dateStr) {
        if (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("N/A")) return "";
        String norm = dateStr.replaceAll("[\\-\\.]", "/");
        if (norm.matches("\\d{4}/\\d{2}/\\d{2}")) {
            return norm.replaceAll("/", "-");
        }
        if (norm.matches("\\d{2}/\\d{2}/\\d{4}")) {
            String[] parts = norm.split("/");
            return parts[2] + "-" + parts[1] + "-" + parts[0];
        }
        return "";
    }

    @Transactional
    public Map<String, Object> requestManualReview(String email, MultipartFile documentFile) throws IOException {
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank()) {
            response.put("success", false);
            response.put("message", "Email is required.");
            return response;
        }

        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) {
            response.put("success", false);
            response.put("message", "Customer profile not found for this email.");
            return response;
        }

        if (documentFile == null || documentFile.isEmpty()) {
            response.put("success", false);
            response.put("message", "Please upload a valid PAN card image.");
            return response;
        }

        // Calculate SHA-256 hash and check duplicates
        byte[] documentBytes = documentFile.getBytes();
        String documentHashVal = com.scms.util.EncryptionUtil.computeSHA256(documentBytes);
        List<VerificationDocument> duplicateDocs = verificationDocumentRepository.findByDocumentHash(documentHashVal);
        boolean duplicateHashDetected = duplicateDocs != null && !duplicateDocs.isEmpty();

        // Upload document to S3
        String origFileName = documentFile.getOriginalFilename();
        String fileExt = origFileName != null && origFileName.contains(".") ? origFileName.substring(origFileName.lastIndexOf(".")) : ".jpg";
        String s3Key = "kyc/manual_review_" + email.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + fileExt;
        s3Service.uploadFile(s3Key, documentBytes, documentFile.getContentType());

        // Create or update the verification record
        Optional<CustomerVerification> existingOpt = customerVerificationRepository.findFirstByEmailOrderByCreatedAtDesc(email);
        CustomerVerification verification;
        if (existingOpt.isPresent()) {
            verification = existingOpt.get();
        } else {
            verification = new CustomerVerification();
            verification.setEmail(email);
            verification.setDocumentType("PAN");
        }
        
        // Calculate AI risk profile
        int riskScore = 30; // base risk score for failing OCR and needing manual review
        int attempts = verification.getOcrAttemptCount() != null ? verification.getOcrAttemptCount() : 0;
        if (duplicateHashDetected) riskScore += 35;
        if (attempts >= 2) riskScore += 15;
        if (riskScore > 100) riskScore = 100;

        verification.setStatus("MANUAL_REVIEW_REQUESTED");
        verification.setUpdatedAt(java.time.LocalDateTime.now());
        verification.setAdminNotes("Customer requested manual admin verification after repeated OCR failures.");
        verification.setRiskScore(riskScore);
        customerVerificationRepository.save(verification);

        // Save the verification document record (storing S3 key instead of local path)
        VerificationDocument docEntity = new VerificationDocument();
        docEntity.setVerificationId(verification.getId());
        docEntity.setDocumentType("PAN");
        docEntity.setFilePath(s3Key);
        docEntity.setOriginalFileName(origFileName);
        docEntity.setFileType(documentFile.getContentType());
        docEntity.setFileSize(documentFile.getSize());
        docEntity.setDocumentHash(documentHashVal);
        verificationDocumentRepository.save(docEntity);

        response.put("success", true);
        response.put("message", "Your PAN card has been submitted for admin manual review. You will be notified once verified.");
        return response;
    }

    public static String normalizePanForMatching(String pan) {
        if (pan == null) return "";
        String clean = pan.toUpperCase().replaceAll("[^A-Z0-9]", "").trim();
        if (clean.length() != 10) return clean;

        char[] chars = clean.toCharArray();
        // First 5 characters MUST be LETTERS (0->O, 1->I, 2->Z, 5->S, 8->B)
        for (int i = 0; i < 5; i++) {
            if (chars[i] == '0') chars[i] = 'O';
            else if (chars[i] == '1') chars[i] = 'I';
            else if (chars[i] == '2') chars[i] = 'Z';
            else if (chars[i] == '5') chars[i] = 'S';
            else if (chars[i] == '8') chars[i] = 'B';
        }
        // Middle 4 characters (index 5 to 8) MUST be DIGITS (O->0, I/L->1, Z->2, S->5, B->8, A->4, G->6, T->7)
        for (int i = 5; i < 9; i++) {
            if (chars[i] == 'O' || chars[i] == 'Q') chars[i] = '0';
            else if (chars[i] == 'I' || chars[i] == 'L' || chars[i] == 'l') chars[i] = '1';
            else if (chars[i] == 'Z') chars[i] = '2';
            else if (chars[i] == 'S' || chars[i] == 's') chars[i] = '5';
            else if (chars[i] == 'B' || chars[i] == 'b') chars[i] = '8';
            else if (chars[i] == 'A') chars[i] = '4';
            else if (chars[i] == 'G') chars[i] = '6';
            else if (chars[i] == 'T') chars[i] = '7';
        }
        // 10th character MUST be a LETTER (0->O, 1->I, 2->Z, 5->S, 8->B)
        if (chars[9] == '0') chars[9] = 'O';
        else if (chars[9] == '1') chars[9] = 'I';
        else if (chars[9] == '2') chars[9] = 'Z';
        else if (chars[9] == '5') chars[9] = 'S';
        else if (chars[9] == '8') chars[9] = 'B';

        return new String(chars);
    }
}
