package com.scms.controller;

import com.scms.entity.VehicleLocation;
import com.scms.entity.LogisticsCompany;
import com.scms.entity.LogisticsVehicle;
import com.scms.repository.VehicleLocationRepository;
import com.scms.repository.LogisticsCompanyRepository;
import com.scms.repository.LogisticsVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/vehicle-locations")
@CrossOrigin(origins = "*")
public class VehicleLocationController {

    @Autowired
    private VehicleLocationRepository repository;

    @Autowired
    private LogisticsCompanyRepository companyRepository;

    @Autowired
    private LogisticsVehicleRepository vehicleRepository;

    @GetMapping
    public List<VehicleLocation> getAll() {
        return repository.findAll();
    }

    @GetMapping("/my-vehicles")
    public ResponseEntity<?> getMyVehicleLocations(@RequestParam String companyEmail) {
        LogisticsCompany lc = companyRepository.findFirstByEmail(companyEmail);
        if (lc == null) {
            return ResponseEntity.badRequest().body("Company not found");
        }

        List<LogisticsVehicle> vehicles = vehicleRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (LogisticsVehicle v : vehicles) {
            if (lc.getCompanyName().equalsIgnoreCase(v.getCompanyName())) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", v.getId());
                map.put("vehicleNumber", v.getVehicleNumber());
                map.put("vehicleType", v.getVehicleType());
                map.put("driverName", v.getDriverName());
                map.put("status", v.getStatus());
                map.put("latitude", v.getLatitude() != null ? v.getLatitude() : 11.0168);
                map.put("longitude", v.getLongitude() != null ? v.getLongitude() : 76.9558);

                VehicleLocation loc = repository.findByVehicleId(v.getId()).orElse(null);
                if (loc != null) {
                    map.put("currentRoute", loc.getCurrentRoute());
                    map.put("latitude", loc.getLatitude());
                    map.put("longitude", loc.getLongitude());
                    map.put("status", loc.getStatus());
                } else {
                    map.put("currentRoute", "Coimbatore -> Tiruppur Hub");
                }
                result.add(map);
            }
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<?> updateVehicleLocation(@PathVariable int vehicleId, @RequestBody Map<String, Object> payload) {
        LogisticsVehicle v = vehicleRepository.findById(vehicleId).orElse(null);
        if (v == null) {
            return ResponseEntity.badRequest().body("Vehicle not found");
        }

        VehicleLocation loc = repository.findByVehicleId(vehicleId).orElse(null);
        if (loc == null) {
            loc = new VehicleLocation();
            loc.setVehicleId(vehicleId);
            LogisticsCompany lc = companyRepository.findAll().stream()
                    .filter(c -> c.getCompanyName().equalsIgnoreCase(v.getCompanyName()))
                    .findFirst().orElse(null);
            if (lc != null) {
                loc.setLogisticsCompanyId(lc.getId());
            }
            loc.setVehicleNumber(v.getVehicleNumber());
            loc.setDriverName(v.getDriverName());
        }

        if (payload.containsKey("latitude")) {
            double lat = Double.parseDouble(payload.get("latitude").toString());
            loc.setLatitude(lat);
            v.setLatitude(lat);
        }
        if (payload.containsKey("longitude")) {
            double lon = Double.parseDouble(payload.get("longitude").toString());
            loc.setLongitude(lon);
            v.setLongitude(lon);
        }
        if (payload.containsKey("status")) {
            String status = payload.get("status").toString();
            loc.setStatus(status);
            v.setStatus(status);
        }
        if (payload.containsKey("currentRoute")) {
            loc.setCurrentRoute(payload.get("currentRoute").toString());
        }

        repository.save(loc);
        vehicleRepository.save(v);

        return ResponseEntity.ok(loc);
    }
}
