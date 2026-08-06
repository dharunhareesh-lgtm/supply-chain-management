package com.scms.controller;

import com.scms.dto.LocationSearchResult;
import com.scms.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = "*")
public class LocationController {

    @Autowired
    private LocationService locationService;

    @GetMapping("/search")
    public ResponseEntity<List<LocationSearchResult>> search(@RequestParam(value = "q", required = false) String q) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(locationService.search(q));
    }

    @GetMapping("/reverse")
    public ResponseEntity<LocationSearchResult> reverse(
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude) {
        LocationSearchResult result = locationService.reverse(latitude, longitude);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
