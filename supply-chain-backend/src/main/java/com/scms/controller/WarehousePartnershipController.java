package com.scms.controller;

import com.scms.entity.WarehousePartnerRequest;
import com.scms.entity.ApprovedWarehouseLogistics;
import com.scms.entity.LogisticsCompany;
import com.scms.entity.WarehouseLocation;
import com.scms.repository.WarehousePartnerRequestRepository;
import com.scms.repository.ApprovedWarehouseLogisticsRepository;
import com.scms.repository.LogisticsCompanyRepository;
import com.scms.repository.WarehouseLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/warehouse-partnerships")
@CrossOrigin(origins = "*")
public class WarehousePartnershipController {

    @Autowired
    private WarehousePartnerRequestRepository requestRepository;

    @Autowired
    private ApprovedWarehouseLogisticsRepository approvedRepository;

    @Autowired
    private LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @GetMapping("/status")
    public ResponseEntity<?> getPartnershipStatuses(@RequestParam String warehouseEmail) {
        WarehouseLocation wl = warehouseLocationRepository.findByRegisteredEmail(warehouseEmail).orElse(null);
        if (wl == null) {
            return ResponseEntity.badRequest().body("Warehouse not found");
        }

        List<LogisticsCompany> companies = logisticsCompanyRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (LogisticsCompany lc : companies) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", lc.getId());
            map.put("name", lc.getCompanyName());
            map.put("email", lc.getEmail());
            map.put("rating", lc.getCompanyRating());
            map.put("serviceRegion", lc.getServiceRegions());

            WarehousePartnerRequest req = requestRepository.findByWarehouseIdAndLogisticsCompanyId(wl.getId(), lc.getId()).orElse(null);
            if (req == null) {
                map.put("status", "NONE");
            } else {
                map.put("status", req.getStatus());
            }
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestPartnership(@RequestBody Map<String, String> payload) {
        String warehouseEmail = payload.get("warehouseEmail");
        int companyId = Integer.parseInt(payload.get("logisticsCompanyId"));

        WarehouseLocation wl = warehouseLocationRepository.findByRegisteredEmail(warehouseEmail).orElse(null);
        if (wl == null) {
            return ResponseEntity.badRequest().body("Warehouse not found");
        }

        WarehousePartnerRequest req = requestRepository.findByWarehouseIdAndLogisticsCompanyId(wl.getId(), companyId).orElse(null);
        if (req == null) {
            req = new WarehousePartnerRequest();
            req.setWarehouseId(wl.getId());
            req.setLogisticsCompanyId(companyId);
        }
        req.setStatus("PENDING");
        requestRepository.save(req);

        return ResponseEntity.ok(req);
    }

    @GetMapping("/requests-received")
    public ResponseEntity<?> getReceivedRequests(@RequestParam String logisticsEmail) {
        LogisticsCompany lc = logisticsCompanyRepository.findFirstByEmail(logisticsEmail);
        if (lc == null) {
            return ResponseEntity.badRequest().body("Logistics company not found");
        }

        List<WarehousePartnerRequest> requests = requestRepository.findByLogisticsCompanyId(lc.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (WarehousePartnerRequest req : requests) {
            if ("PENDING".equals(req.getStatus())) {
                WarehouseLocation wl = warehouseLocationRepository.findById(req.getWarehouseId()).orElse(null);
                if (wl != null) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("requestId", req.getId());
                    map.put("warehouseName", wl.getWarehouseName());
                    map.put("warehouseEmail", wl.getRegisteredEmail());
                    map.put("district", wl.getDistrict());
                    map.put("address", wl.getAddress());
                    result.add(map);
                }
            }
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/respond")
    @Transactional
    public ResponseEntity<?> respondRequest(@RequestBody Map<String, String> payload) {
        int requestId = Integer.parseInt(payload.get("requestId"));
        String status = payload.get("status"); // ACCEPTED or REJECTED

        WarehousePartnerRequest req = requestRepository.findById(requestId).orElse(null);
        if (req == null) {
            return ResponseEntity.badRequest().body("Request not found");
        }

        req.setStatus(status);
        requestRepository.save(req);

        if ("ACCEPTED".equals(status)) {
            ApprovedWarehouseLogistics approved = approvedRepository.findByWarehouseIdAndLogisticsCompanyId(req.getWarehouseId(), req.getLogisticsCompanyId()).orElse(null);
            if (approved == null) {
                approved = new ApprovedWarehouseLogistics();
                approved.setWarehouseId(req.getWarehouseId());
                approved.setLogisticsCompanyId(req.getLogisticsCompanyId());
                approvedRepository.save(approved);
            }
        } else {
            approvedRepository.deleteByWarehouseIdAndLogisticsCompanyId(req.getWarehouseId(), req.getLogisticsCompanyId());
        }

        return ResponseEntity.ok(req);
    }

    @GetMapping("/approved-partners")
    public ResponseEntity<?> getApprovedPartners(@RequestParam String warehouseEmail) {
        WarehouseLocation wl = warehouseLocationRepository.findByRegisteredEmail(warehouseEmail).orElse(null);
        if (wl == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<ApprovedWarehouseLogistics> approvedList = approvedRepository.findByWarehouseId(wl.getId());
        List<LogisticsCompany> result = new ArrayList<>();
        for (ApprovedWarehouseLogistics auth : approvedList) {
            logisticsCompanyRepository.findById(auth.getLogisticsCompanyId()).ifPresent(result::add);
        }
        return ResponseEntity.ok(result);
    }
}
