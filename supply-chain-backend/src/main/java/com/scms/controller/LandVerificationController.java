package com.scms.controller;

import com.scms.entity.*;
import com.scms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/land-verifications")
@CrossOrigin(origins = "*")
public class LandVerificationController {

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private SupplierLandRecordRepository supplierLandRecordRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private LandLedgerRepository landLedgerRepository;

    @Autowired
    private com.scms.service.S3Service s3Service;

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

    // Yield lookup table (kg per acre) for expected yield calculations
    private static final Map<String, Double> YIELD_LOOKUP = Map.of(
        "Cereals", 1500.0,
        "Dry Fruits", 800.0,
        "Grains", 1200.0,
        "Oil Seeds", 700.0,
        "Pulses and Dals", 600.0,
        "Spices", 500.0
    );

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLandVerifications(
            @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status) {
        
        List<LandRecord> records;
        if ("ALL".equalsIgnoreCase(status)) {
            records = landRecordRepository.findAll();
        } else {
            records = landRecordRepository.findByVerificationStatus(status.toUpperCase());
        }

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (LandRecord record : records) {
            Map<String, Object> map = new HashMap<>();
            map.put("landRecord", record);
            
            // Fetch linked suppliers/farmers
            List<SupplierLandRecord> joins = supplierLandRecordRepository.findByLandRecordId(record.getId());
            List<Map<String, Object>> farmers = new ArrayList<>();
            for (SupplierLandRecord join : joins) {
                Supplier supplier = supplierRepository.findById(join.getSupplierId()).orElse(null);
                if (supplier != null) {
                    Map<String, Object> supplierMap = new HashMap<>();
                    supplierMap.put("supplierId", supplier.getSupplierId());
                    supplierMap.put("name", supplier.getSupplierName());
                    supplierMap.put("email", supplier.getEmail());
                    supplierMap.put("phone", supplier.getPhone());
                    supplierMap.put("verificationTier", supplier.getVerificationTier());
                    farmers.add(supplierMap);
                }
            }
            map.put("farmers", farmers);
            responseList.add(map);
        }

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLandVerificationDetail(@PathVariable("id") Long id) {
        LandRecord record = landRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("landRecord", record);

        // Fetch linked suppliers/farmers
        List<SupplierLandRecord> joins = supplierLandRecordRepository.findByLandRecordId(record.getId());
        List<Map<String, Object>> farmers = new ArrayList<>();
        int primarySupplierId = -1;
        for (SupplierLandRecord join : joins) {
            Supplier supplier = supplierRepository.findById(join.getSupplierId()).orElse(null);
            if (supplier != null) {
                if (primarySupplierId == -1) primarySupplierId = supplier.getSupplierId();
                Map<String, Object> supplierMap = new HashMap<>();
                supplierMap.put("supplierId", supplier.getSupplierId());
                supplierMap.put("name", supplier.getSupplierName());
                supplierMap.put("email", supplier.getEmail());
                supplierMap.put("phone", supplier.getPhone());
                supplierMap.put("verificationTier", supplier.getVerificationTier());
                supplierMap.put("aadhaarName", supplier.getAadhaarName());
                farmers.add(supplierMap);
            }
        }
        response.put("farmers", farmers);

        // Duplicate-land detection warning
        // Search if this survey number is already linked to another APPROVED/verified land record by a different farmer
        List<LandRecord> duplicates = landRecordRepository.findAll().stream()
            .filter(lr -> !lr.getId().equals(record.getId()) &&
                          "APPROVED".equalsIgnoreCase(lr.getVerificationStatus()) &&
                          lr.getSurveyNumber().equalsIgnoreCase(record.getSurveyNumber()) &&
                          lr.getVillage().equalsIgnoreCase(record.getVillage()) &&
                          lr.getTaluk().equalsIgnoreCase(record.getTaluk()) &&
                          lr.getDistrict().equalsIgnoreCase(record.getDistrict()))
            .toList();

        List<String> duplicateWarnings = new ArrayList<>();
        for (LandRecord dup : duplicates) {
            List<SupplierLandRecord> dupJoins = supplierLandRecordRepository.findByLandRecordId(dup.getId());
            for (SupplierLandRecord dj : dupJoins) {
                if (dj.getSupplierId() != primarySupplierId) {
                    Supplier s = supplierRepository.findById(dj.getSupplierId()).orElse(null);
                    if (s != null) {
                        duplicateWarnings.add("This survey number is already linked to verified Supplier: " 
                            + s.getSupplierName() + " (ID: " + s.getSupplierId() + "). Confirm cultivation split before approving.");
                    }
                }
            }
        }
        response.put("duplicateWarnings", duplicateWarnings);

        // expected yield (kg) lookup calculations
        Map<String, Map<String, Double>> yieldEstimates = new HashMap<>();
        double extent = record.getExtentAcres() != null ? record.getExtentAcres() : 0.0;
        if (extent > 0.0) {
            for (Map.Entry<String, Double> entry : YIELD_LOOKUP.entrySet()) {
                Map<String, Double> estimates = new HashMap<>();
                estimates.put("maxYield", extent * entry.getValue());
                estimates.put("minYield", extent * entry.getValue() * 0.7); // 30% lower bound
                yieldEstimates.put(entry.getKey(), estimates);
            }
        }
        response.put("yieldEstimates", yieldEstimates);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyLandRecord(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        
        LandRecord record = landRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        String action = (String) body.get("action"); // APPROVE, REJECT, FLAG
        if (action == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Action is required (APPROVE, REJECT, FLAG)."));
        }

        String notes = (String) body.get("notes");
        Double verifiedExtent = body.containsKey("extentAcres") ? Double.valueOf(body.get("extentAcres").toString()) : record.getExtentAcres();
        Boolean isJoint = body.containsKey("isJointPatta") ? Boolean.valueOf(body.get("isJointPatta").toString()) : record.getIsJointPatta();
        String cultivatorName = (String) body.get("adangalCultivatorName");
        String landownerPhone = (String) body.get("landownerPhone");
        String callLog = (String) body.get("callLog");

        record.setExtentAcres(verifiedExtent);
        record.setIsJointPatta(isJoint);
        record.setAdangalCultivatorName(cultivatorName);
        record.setLandownerPhone(landownerPhone);
        record.setCallLog(callLog);
        record.setVerifiedDate(LocalDateTime.now());

        if ("APPROVE".equalsIgnoreCase(action)) {
            record.setVerificationStatus("APPROVED");
            
            // Create or update Land Ledger
            LandLedger ledger = landLedgerRepository.findByLandRecordId(record.getId()).orElse(new LandLedger());
            ledger.setLandRecordId(record.getId());
            if (ledger.getCumulativeSoldThisSeason() == null) {
                ledger.setCumulativeSoldThisSeason(0.0);
            }
            landLedgerRepository.save(ledger);

            // Update linked suppliers verification status to SELL_VERIFIED
            List<SupplierLandRecord> joins = supplierLandRecordRepository.findByLandRecordId(record.getId());
            for (SupplierLandRecord join : joins) {
                Supplier supplier = supplierRepository.findById(join.getSupplierId()).orElse(null);
                if (supplier != null) {
                    supplier.setVerificationTier("SELL_VERIFIED");
                    supplierRepository.save(supplier);
                }
            }
        } else if ("REJECT".equalsIgnoreCase(action)) {
            record.setVerificationStatus("REJECTED");
        } else {
            record.setVerificationStatus("FLAGGED");
        }

        landRecordRepository.save(record);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "status", record.getVerificationStatus(),
            "message", "Land verification updated to " + record.getVerificationStatus()
        ));
    }

    @GetMapping("/ledger/{id}")
    public ResponseEntity<?> getLandLedgerDetails(@PathVariable("id") Long landRecordId) {
        LandRecord record = landRecordRepository.findById(landRecordId).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        LandLedger ledger = landLedgerRepository.findByLandRecordId(landRecordId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        response.put("landRecord", record);
        response.put("ledger", ledger);

        // Fetch linked suppliers
        List<SupplierLandRecord> joins = supplierLandRecordRepository.findByLandRecordId(record.getId());
        List<String> linkedFarmers = new ArrayList<>();
        for (SupplierLandRecord join : joins) {
            Supplier s = supplierRepository.findById(join.getSupplierId()).orElse(null);
            if (s != null) {
                linkedFarmers.add(s.getSupplierName() + " (ID: " + s.getSupplierId() + ")");
            }
        }
        response.put("linkedFarmers", linkedFarmers);

        // expected yield per crop category
        Map<String, Map<String, Double>> yieldEstimates = new HashMap<>();
        double extent = record.getExtentAcres() != null ? record.getExtentAcres() : 0.0;
        if (extent > 0.0) {
            for (Map.Entry<String, Double> entry : YIELD_LOOKUP.entrySet()) {
                Map<String, Double> estimates = new HashMap<>();
                estimates.put("maxYield", extent * entry.getValue());
                estimates.put("minYield", extent * entry.getValue() * 0.7);
                yieldEstimates.put(entry.getKey(), estimates);
            }
        }
        response.put("yieldEstimates", yieldEstimates);

        return ResponseEntity.ok(response);
    }
}
