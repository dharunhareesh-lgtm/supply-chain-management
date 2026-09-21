package com.scms.controller;

import com.scms.entity.LandRecord;
import com.scms.entity.Supplier;
import com.scms.entity.SupplierLandRecord;
import com.scms.repository.LandRecordRepository;
import com.scms.repository.SupplierLandRecordRepository;
import com.scms.repository.SupplierRepository;
import com.scms.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping("/api/supplier/land-verifications")
@CrossOrigin(origins = "*")
public class SupplierLandVerificationController {

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private SupplierLandRecordRepository supplierLandRecordRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private S3Service s3Service;

    @Value("${scms.kyc.upload-dir:uploads/}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
            }
            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
            String uniqueName = UUID.randomUUID().toString() + ext;

            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File localFile = new File(uploadDir + uniqueName);
            file.transferTo(localFile);

            String s3Key = "land-documents/" + uniqueName;
            byte[] bytes = Files.readAllBytes(localFile.toPath());
            s3Service.uploadFile(s3Key, bytes, file.getContentType());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "filePath", s3Key,
                    "originalName", originalName
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<?> submitLandRecord(@RequestBody Map<String, Object> body) {
        Integer supplierId = (Integer) body.get("supplierId");
        String surveyNumber = (String) body.get("surveyNumber");
        String village = (String) body.get("village");
        String taluk = (String) body.get("taluk");
        String district = (String) body.get("district");

        if (supplierId == null || surveyNumber == null || village == null || taluk == null || district == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Supplier ID, survey number, village, taluk, and district are required."));
        }

        Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
        if (supplier == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Supplier not found."));
        }

        LandRecord record = new LandRecord();
        record.setSurveyNumber(surveyNumber);
        record.setVillage(village);
        record.setTaluk(taluk);
        record.setDistrict(district);
        record.setSubDivision((String) body.get("subDivision"));
        record.setOwnershipType((String) body.get("ownershipType"));

        if (body.get("extentAcres") != null) {
            record.setExtentAcres(Double.valueOf(body.get("extentAcres").toString()));
        }
        if (body.get("isJointPatta") != null) {
            record.setIsJointPatta(Boolean.valueOf(body.get("isJointPatta").toString()));
        }
        record.setAdangalCultivatorName((String) body.get("adangalCultivatorName"));
        record.setLandownerPhone((String) body.get("landownerPhone"));
        record.setLeaseDocumentUrl((String) body.get("leaseDocumentUrl"));
        record.setPhotoUrl((String) body.get("photoUrl"));

        if (body.get("latitude") != null) {
            record.setLatitude(Double.valueOf(body.get("latitude").toString()));
        }
        if (body.get("longitude") != null) {
            record.setLongitude(Double.valueOf(body.get("longitude").toString()));
        }

        record.setVerificationStatus("PENDING");
        landRecordRepository.save(record);

        SupplierLandRecord join = new SupplierLandRecord(supplierId, record.getId());
        supplierLandRecordRepository.save(join);

        // Update supplier status to SELL_PENDING if not already SELL_VERIFIED
        if (!"SELL_VERIFIED".equalsIgnoreCase(supplier.getVerificationTier())) {
            supplier.setVerificationTier("SELL_PENDING");
            supplierRepository.save(supplier);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Land verification request submitted successfully.",
                "landRecordId", record.getId()
        ));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<LandRecord>> getSupplierLandRecords(@PathVariable("supplierId") int supplierId) {
        List<SupplierLandRecord> joins = supplierLandRecordRepository.findBySupplierId(supplierId);
        List<LandRecord> records = new ArrayList<>();
        for (SupplierLandRecord join : joins) {
            landRecordRepository.findById(join.getLandRecordId()).ifPresent(records::add);
        }
        return ResponseEntity.ok(records);
    }

    @GetMapping("/document-url")
    public ResponseEntity<?> getDocumentUrl(@RequestParam("key") String key) {
        try {
            if (key == null || key.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Key is required."));
            }
            String presignedUrl = s3Service.generatePresignedUrl(key, 15);
            return ResponseEntity.ok(Map.of("url", presignedUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate S3 URL: " + e.getMessage()));
        }
    }
}
