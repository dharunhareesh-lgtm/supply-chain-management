package com.scms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/cargo-packing")
@CrossOrigin(origins = "*")
public class CargoArrangementController {

    public static class PackItemRequest {
        public int size; // e.g. 50, 60
        public int count; // number of bags
    }

    public static class CargoPackage {
        public String id;
        public int size;
        public double x;
        public double y;
        public double z;
        public double w; // width
        public double h; // height
        public double l; // length
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePacking(@RequestBody List<PackItemRequest> items) {
        int totalWeight = 0;
        List<CargoPackage> packages = new ArrayList<>();

        // Truck Dimensions: Width = 2.0m, Height = 2.0m, Length = 5.0m
        // Grid placement settings
        double curX = -0.8;
        double curZ = -2.2;
        double curY = 0.15; // Bottom offset

        int index = 0;
        for (PackItemRequest item : items) {
            int count = item.count;
            int size = item.size;
            totalWeight += size * count;

            double w = 0.6;
            double l = 0.8;
            double h = 0.3;
            if (size == 60) {
                w = 0.65;
                l = 0.85;
                h = 0.35;
            } else if (size == 25) {
                w = 0.5;
                l = 0.6;
                h = 0.25;
            } else if (size == 100) {
                w = 0.8;
                l = 1.0;
                h = 0.4;
            }

            for (int i = 0; i < count; i++) {
                CargoPackage pkg = new CargoPackage();
                pkg.id = "pkg-" + size + "-" + (++index);
                pkg.size = size;
                pkg.x = curX;
                pkg.y = curY;
                pkg.z = curZ;
                pkg.w = w;
                pkg.h = h;
                pkg.l = l;
                packages.add(pkg);

                // Advance X position
                curX += w + 0.1;
                if (curX > 0.8) {
                    // Reset X, advance Z
                    curX = -0.8;
                    curZ += l + 0.1;
                }
                if (curZ > 2.2) {
                    // Reset Z, advance Y (stack layer)
                    curZ = -2.2;
                    curY += h + 0.05;
                }
            }
        }

        int truckCapacity = 5000;
        int remainingCapacity = truckCapacity - totalWeight;
        double utilization = (double) totalWeight / truckCapacity * 100.0;
        utilization = Math.round(utilization * 100.0) / 100.0;

        return ResponseEntity.ok(Map.of(
            "truckCapacity", truckCapacity,
            "totalLoad", totalWeight,
            "remainingCapacity", remainingCapacity,
            "utilizationPct", utilization,
            "packages", packages
        ));
    }
}
