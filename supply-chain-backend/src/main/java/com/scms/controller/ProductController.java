package com.scms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Product;
import com.scms.service.ProductService;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private com.scms.repository.UserRepository userRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    private void checkWarehouseAccess(String email, Integer warehouseId) {
        if (email == null || email.isBlank()) {
            return;
        }
        // If it's a manager, validate their warehouseId
        com.scms.entity.Manager mgr = managerRepository.findByEmail(email);
        if (mgr == null) {
            mgr = managerRepository.findByUsername(email);
        }
        if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
            if (warehouseId != null && !warehouseId.equals(mgr.getWarehouseId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: Managers cannot access another warehouse."
                );
            }
            return;
        }

        com.scms.entity.User user = userRepository.findByUsername(email);
        if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
            com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                .filter(w -> email.equalsIgnoreCase(w.getRegisteredEmail()))
                .findFirst().orElse(null);
            if (wl != null && warehouseId != null && wl.getId() != warehouseId) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: You do not have permission to view data belonging to other warehouses."
                );
            }
        }
    }

    /**
     * GET /products
     * @param status  "APPROVED" (default, customer-safe), "PENDING", "REJECTED", or "ALL" (warehouse/supplier internal)
     */
    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) Integer warehouseId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive,
            @RequestParam(required = false, defaultValue = "APPROVED") String status,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        if (userEmail != null && !userEmail.isBlank()) {
            // Check manager first
            com.scms.entity.Manager mgr = managerRepository.findByEmail(userEmail);
            if (mgr == null) {
                mgr = managerRepository.findByUsername(userEmail);
            }
            if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
                warehouseId = mgr.getWarehouseId();
                category = mgr.getCategory();
                status = "ALL";
            } else {
                // Otherwise check standard Warehouse user
                com.scms.entity.User user = userRepository.findByUsername(userEmail);
                if (user != null && "WAREHOUSE".equalsIgnoreCase(user.getRole())) {
                    com.scms.entity.WarehouseLocation wl = warehouseLocationRepository.findAll().stream()
                        .filter(w -> userEmail.equalsIgnoreCase(w.getRegisteredEmail()))
                        .findFirst().orElse(null);
                    if (wl != null) {
                        warehouseId = wl.getId();
                    }
                    status = "ALL";
                }
            }
        }

        checkWarehouseAccess(userEmail, warehouseId);
        return productService.getProducts(warehouseId, category, includeInactive, status);
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable int id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Product p = productService.getProductById(id);
        if (p != null) {
            checkWarehouseAccess(userEmail, p.getWarehouseId());
        }
        return p;
    }

    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Product product) {
        try {
            Product saved = productService.addProduct(product);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage())
            );
        }
    }

    private void validateManagerForProduct(String email, Product product) {
        if (email == null || email.isBlank() || product == null) {
            return;
        }
        com.scms.entity.Manager mgr = managerRepository.findByEmail(email);
        if (mgr == null) {
            mgr = managerRepository.findByUsername(email);
        }
        if (mgr != null && (mgr.getIsWarehouseAccount() == null || !mgr.getIsWarehouseAccount())) {
            if (product.getWarehouseId() != null && !product.getWarehouseId().equals(mgr.getWarehouseId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: Product belongs to another warehouse."
                );
            }
            if (product.getCategory() != null && !product.getCategory().equalsIgnoreCase(mgr.getCategory())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, 
                    "Access denied: Product category does not match manager's category."
                );
            }
        }
    }

    /**
     * POST /products/{id}/approve — Atomically approve a product.
     * Creates inventory, updates warehouse capacity, sets status to APPROVED.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveProduct(
            @PathVariable int id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            Product product = productService.getProductById(id);
            if (product != null) {
                validateManagerForProduct(userEmail, product);
            }
            Map<String, Object> result = productService.approveProduct(id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /products/{id}/reject — Reject a product.
     * Sets status to REJECTED. No inventory or capacity changes.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectProduct(
            @PathVariable int id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            Product product = productService.getProductById(id);
            if (product != null) {
                validateManagerForProduct(userEmail, product);
            }
            Map<String, Object> result = productService.rejectProduct(id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/supplier/{supplierId}")
    public List<Product> getProductsBySupplierId(
            @PathVariable int supplierId) {
        return productService.getProductsBySupplierId(supplierId);
    }

    @PutMapping
    public Product updateProduct(@RequestBody Product product) {
        return productService.updateProduct(product);
    }

    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable int id) {
        productService.deleteProduct(id);
        return "Product Deleted Successfully";
    }

    @GetMapping("/approved-names")
    public List<String> getApprovedProductNames() {
        return productService.getApprovedProductNames();
    }

    @GetMapping("/allowed-categories")
    public List<String> getAllowedCategories() {
        return productService.getAllowedCategories();
    }

    @GetMapping("/listings")
    public List<Product> getProductListings(@RequestParam String productName) {
        return productService.getProductsByName(productName);
    }
}