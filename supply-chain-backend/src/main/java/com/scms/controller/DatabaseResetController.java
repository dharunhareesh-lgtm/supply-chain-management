package com.scms.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class DatabaseResetController {

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/reset-database")
    @Transactional
    public ResponseEntity<?> resetDatabase() {
        try {
            // Disable foreign key checks for clean truncation/deletion
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();

            // Truncate transactional and product/inventory tables
            entityManager.createNativeQuery("TRUNCATE TABLE deliveries").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE orders").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE inventory").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE market_price_history").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE forecast_results").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE products").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE product_packages").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE suppliers").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE managers").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE otps").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE category_capacity").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE packaging_standards").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE warehouse_insurance_policies").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE warehouse_insurance_claims").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE logistics_vehicles").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE logistics_companies").executeUpdate();

            // Seed default logistics companies
            entityManager.createNativeQuery("INSERT INTO logistics_companies (company_name, contact_info, email, service_regions, company_rating, license_details, status) VALUES ('FastMove Logistics', '+91 98765 43210', 'logistics@gmail.com', 'South, West', 4.5, 'LIC-LOG-99281', 'APPROVED')").executeUpdate();

            // Seed default packaging standards
            entityManager.createNativeQuery("INSERT INTO packaging_standards (size, active) VALUES (25, 1), (50, 1), (60, 1), (100, 1)").executeUpdate();

            // Seed default insurance policies
            entityManager.createNativeQuery("INSERT INTO warehouse_insurance_policies (policy_name, coverage_percentage, status) VALUES ('Standard Fire Insurance', 90.0, 'ACTIVE'), ('All-Risk Crop Cover', 95.0, 'ACTIVE'), ('Basic Theft Policy', 80.0, 'ACTIVE')").executeUpdate();

            // Seed category capacities
            entityManager.createNativeQuery("INSERT INTO category_capacity (category, max_capacity, used_capacity) VALUES ('Pulses and Dals', 50000, 0), ('Grains', 80000, 0), ('Cereals', 75000, 0), ('Spices', 30000, 0), ('Dry Fruits', 20000, 0), ('Oil Seeds', 45000, 0)").executeUpdate();

            // Seed default logistics vehicles
            entityManager.createNativeQuery("INSERT INTO logistics_vehicles (vehicle_number, vehicle_type, vehicle_photo, capacity_kg, available_space_kg, current_load_kg, driver_name, driver_contact, is_available, service_region, company_name, rating, transport_cost_per_kg) VALUES " +
                "('TN-37-AB-1234', 'Tata Ace', '', 1500, 1500, 0, 'Rajesh Kumar', '+91 98765 43210', 1, 'South', 'FastMove Logistics', 4.5, 4.0), " +
                "('KA-01-MJ-5678', 'Ashok Leyland Dost', '', 2500, 2500, 0, 'Manjunath Gowda', '+91 98765 43211', 1, 'South', 'Express Agri Carriers', 4.2, 3.8), " +
                "('MH-12-PQ-9012', 'Mahindra Bolero Maxi Truck', '', 3500, 3500, 0, 'Suresh Patil', '+91 98765 43212', 1, 'West', 'SafeTransit Supply', 4.8, 5.0), " +
                "('DL-01-AA-9999', 'Eicher Pro 2049', '', 5000, 5000, 0, 'Baldev Singh', '+91 98765 43213', 1, 'North', 'Grand Agri Logistics', 4.6, 4.5)").executeUpdate();

            // Remove non-admin users (Customer, Supplier, Manager, Logistics logins)
            entityManager.createNativeQuery("DELETE FROM users WHERE role IS NULL OR LOWER(role) != 'admin'").executeUpdate();

            // Enable foreign key checks back
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();

            return ResponseEntity.ok(Map.of("message", "Database successfully reset and seeded."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Database reset failed: " + e.getMessage()));
        }
    }
}
