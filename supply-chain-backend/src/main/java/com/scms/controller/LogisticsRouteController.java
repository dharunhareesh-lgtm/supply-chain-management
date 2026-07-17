package com.scms.controller;

import com.scms.util.HaversineUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/logistics")
@CrossOrigin(origins = "*")
public class LogisticsRouteController {

    private static final double AVG_SPEED_KMH = 40.0;

    /**
     * GET /logistics/route-info — Calculate route information between two points
     * Returns distance (km), estimated travel time, and ETA
     */
    @GetMapping("/route-info")
    public ResponseEntity<?> getRouteInfo(
            @RequestParam Double fromLat,
            @RequestParam Double fromLng,
            @RequestParam Double toLat,
            @RequestParam Double toLng) {

        double distanceKm = HaversineUtil.calculateDistance(fromLat, fromLng, toLat, toLng);
        double travelTimeHours = distanceKm / AVG_SPEED_KMH;

        int hours = (int) travelTimeHours;
        int minutes = (int) ((travelTimeHours - hours) * 60);

        // ETA from now
        java.time.LocalDateTime eta = java.time.LocalDateTime.now()
                .plusHours(hours).plusMinutes(minutes);

        String estimatedTime;
        if (hours > 0) {
            estimatedTime = hours + " hr " + minutes + " min";
        } else {
            estimatedTime = minutes + " min";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("distanceKm", Math.round(distanceKm * 10.0) / 10.0);
        result.put("estimatedTravelTime", estimatedTime);
        result.put("eta", eta.toString());
        result.put("avgSpeedKmh", AVG_SPEED_KMH);
        result.put("fromLatitude", fromLat);
        result.put("fromLongitude", fromLng);
        result.put("toLatitude", toLat);
        result.put("toLongitude", toLng);

        return ResponseEntity.ok(result);
    }
}
