package com.scms.service;
import com.scms.entity.Inventory;
import com.scms.entity.CategoryCapacity;
import com.scms.entity.WarehouseLocation;
import com.scms.repository.InventoryRepository;
import com.scms.repository.CategoryCapacityRepository;
import com.scms.repository.WarehouseLocationRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.Product;
import com.scms.repository.ProductRepository;

import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ProductPackageRepository productPackageRepository;

    @Autowired
    private com.scms.repository.SupplierRepository supplierRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CategoryCapacityRepository categoryCapacityRepository;

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
        "Pulses and Dals",
        "Grains",
        "Cereals",
        "Spices",
        "Dry Fruits",
        "Oil Seeds"
    );

    // ── Perishable keywords that must be rejected ──
    private static final List<String> PERISHABLE_KEYWORDS = Arrays.asList(
        "tomato", "onion", "banana", "milk", "fish", "meat", "vegetable", "fruit", "dairy", "perishable"
    );

    private void populatePackages(Product product) {
        if (product != null) {
            product.setPackageBreakdown(productPackageRepository.findByProductId(product.getProductId()));
        }
    }

    /**
     * Core product listing method with status-based security filtering and database-level multi-tenant isolation.
     *
     * @param warehouseId  Filter by warehouse (null = all warehouses)
     * @param category     Filter by product category (null = all categories)
     * @param includeInactive If true, include products from INACTIVE warehouses
     * @param status       "APPROVED" (default for customers), "PENDING", "REJECTED", or "ALL" (for internal use)
     */
    public List<Product> getProducts(Integer warehouseId, String category, boolean includeInactive, String status) {
        List<Product> products;
        if (warehouseId != null) {
            if (category != null && !category.isBlank()) {
                products = productRepository.findByWarehouseIdAndCategory(warehouseId, category);
            } else {
                products = productRepository.findByWarehouseId(warehouseId);
            }
        } else if (category != null && !category.isBlank()) {
            products = productRepository.findByCategory(category);
        } else {
            products = productRepository.findAll();
        }

        products.forEach(this::populatePackages);

        // Filter out inactive supplier products (only exclude if explicitly set to INACTIVE)
        List<Integer> activeSupplierIds = supplierRepository.findAll().stream()
            .filter(s -> s.getStatus() == null || !"INACTIVE".equalsIgnoreCase(s.getStatus()))
            .map(com.scms.entity.Supplier::getSupplierId)
            .collect(Collectors.toList());

        products = products.stream()
            .filter(p -> activeSupplierIds.contains(p.getSupplierId()))
            .collect(Collectors.toList());

        // Filter out inactive warehouse products if includeInactive is false
        if (!includeInactive) {
            List<Integer> activeWarehouseIds = warehouseLocationRepository.findAll().stream()
                .filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus()))
                .map(com.scms.entity.WarehouseLocation::getId)
                .collect(Collectors.toList());

            products = products.stream()
                .filter(p -> p.getWarehouseId() == null || activeWarehouseIds.contains(p.getWarehouseId()))
                .collect(Collectors.toList());
        }

        // Status-based filtering — the core security layer
        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            products = products.stream()
                .filter(p -> status.equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());
        }

        // For APPROVED-only queries, also exclude out-of-stock products
        if ("APPROVED".equalsIgnoreCase(status)) {
            products = products.stream()
                .filter(p -> p.getStock() > 0)
                .collect(Collectors.toList());
        }

        return products;
    }

    /**
     * Backward-compatible overloads — defaults to APPROVED-only for customer safety.
     */
    public List<Product> getProducts(Integer warehouseId, boolean includeInactive, String status) {
        return getProducts(warehouseId, null, includeInactive, status);
    }

    public List<Product> getProducts(Integer warehouseId, boolean includeInactive) {
        return getProducts(warehouseId, null, includeInactive, "APPROVED");
    }

    public List<Product> getAllProducts() {
        return getProducts(null, null, false, "APPROVED");
    }

    public Product getProductById(int id) {
        Product product = productRepository.findById(id).orElse(null);
        populatePackages(product);
        return product;
    }

    public Product addProduct(Product product) {
        // ── Perishable Rejection Check ──
        String lowerCategory = (product.getCategory() != null) ? product.getCategory().toLowerCase().trim() : "";
        String lowerName = (product.getProductName() != null) ? product.getProductName().toLowerCase().trim() : "";

        boolean isPerishable = PERISHABLE_KEYWORDS.stream()
            .anyMatch(kw -> lowerCategory.contains(kw) || lowerName.contains(kw));

        if (isPerishable) {
            throw new IllegalArgumentException(
                "This product is not eligible for warehouse storage because it is highly perishable."
            );
        }

        // ── Category Validation ──
        String category = product.getCategory();
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Product category is required.");
        }

        boolean allowed = ALLOWED_CATEGORIES.stream()
            .anyMatch(c -> c.equalsIgnoreCase(category.trim()));

        if (!allowed) {
            throw new IllegalArgumentException(
                "This product is not eligible for warehouse storage because it is highly perishable."
            );
        }

        // Calculate Selling Price using Profit Model
        double purchasePrice = product.getPurchasePrice();
        String strategy = product.getPricingStrategy();
        double margin = product.getMarginValue();
        double sellingPrice = purchasePrice;

        if ("PROFIT_PERCENTAGE".equalsIgnoreCase(strategy)) {
            sellingPrice = purchasePrice * (1.0 + (margin / 100.0));
        } else if ("PROFIT_PER_KG".equalsIgnoreCase(strategy)) {
            sellingPrice = purchasePrice + margin;
        } else {
            // fallback
            sellingPrice = purchasePrice;
        }
        product.setPrice(sellingPrice);

        // Calculate total weight based on packages
        int totalWeight = 0;
        if (product.getPackageBreakdown() != null && !product.getPackageBreakdown().isEmpty()) {
            for (com.scms.entity.ProductPackage pkg : product.getPackageBreakdown()) {
                totalWeight += pkg.getPackageSize() * pkg.getBagCount();
            }
        } else {
            // default if none provided
            totalWeight = product.getStock();
        }
        product.setStock(totalWeight);
        product.setStatus("PENDING");

        Product saved = productRepository.save(product);

        // Save package details
        if (product.getPackageBreakdown() != null) {
            for (com.scms.entity.ProductPackage pkg : product.getPackageBreakdown()) {
                pkg.setProductId(saved.getProductId());
                productPackageRepository.save(pkg);
            }
        }
        populatePackages(saved);
        return saved;
    }

    /**
     * Approve a product: atomically update status, create inventory, update warehouse capacity.
     */
    @Transactional
    public Map<String, Object> approveProduct(int productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            throw new IllegalArgumentException("Product not found with ID: " + productId);
        }

        if ("APPROVED".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("Product is already approved.");
        }

        // 1. Check warehouse capacity before approving
        Integer warehouseId = product.getWarehouseId();
        String category = product.getCategory();
        int stockWeight = product.getStock();

        CategoryCapacity capacity = null;
        if (warehouseId != null && category != null) {
            List<CategoryCapacity> capacities = categoryCapacityRepository.findByWarehouseId(warehouseId);
            capacity = capacities.stream()
                .filter(c -> category.equalsIgnoreCase(c.getCategory()))
                .findFirst()
                .orElse(null);
        }

        if (capacity != null) {
            int available = capacity.getMaxCapacity() - capacity.getUsedCapacity();
            if (stockWeight > available) {
                throw new IllegalArgumentException(
                    "Insufficient warehouse capacity. Available: " + available + " KG, Required: " + stockWeight + " KG"
                );
            }
        }

        // 2. Update product status to APPROVED
        product.setStatus("APPROVED");
        product.setStorageDate(java.time.LocalDate.now().toString());
        productRepository.save(product);

        // 3. Create Inventory record
        String warehouseName = "Unknown";
        if (warehouseId != null) {
            WarehouseLocation wl = warehouseLocationRepository.findById(warehouseId).orElse(null);
            if (wl != null) {
                warehouseName = wl.getWarehouseName() + " (" + wl.getDistrict() + ")";
            }
        }

        Inventory inventory = new Inventory();
        inventory.setProductName(product.getProductName());
        inventory.setQuantity(stockWeight);
        inventory.setWarehouseLocation(warehouseName);
        inventory.setProductId(product.getProductId());
        inventory.setWarehouseId(warehouseId);
        inventory.setSupplierId(product.getSupplierId());
        inventory.setCategory(category);
        inventoryRepository.save(inventory);

        // 4. Update warehouse category capacity
        if (capacity != null) {
            capacity.setUsedCapacity(capacity.getUsedCapacity() + stockWeight);
            categoryCapacityRepository.save(capacity);
        }

        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("status", "APPROVED");
        result.put("productId", product.getProductId());
        result.put("productName", product.getProductName());
        result.put("inventoryId", inventory.getInventoryId());
        result.put("capacityUpdated", capacity != null);
        result.put("stockAdded", stockWeight);
        result.put("message", "Product approved successfully. Inventory created and warehouse capacity updated.");
        return result;
    }

    /**
     * Reject a product: update status only, no inventory or capacity changes.
     */
    @Transactional
    public Map<String, Object> rejectProduct(int productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            throw new IllegalArgumentException("Product not found with ID: " + productId);
        }

        if ("REJECTED".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("Product is already rejected.");
        }

        // Only update status — no inventory, no capacity changes
        product.setStatus("REJECTED");
        productRepository.save(product);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "REJECTED");
        result.put("productId", product.getProductId());
        result.put("productName", product.getProductName());
        result.put("message", "Product rejected. No inventory or capacity changes made.");
        return result;
    }

    @Transactional
    public Product updateProduct(Product product) {
        Product existingProduct =
                productRepository
                .findById(product.getProductId())
                .orElse(null);

        // If status is changing to APPROVED via the general update endpoint,
        // delegate to the atomic approveProduct method
        if (existingProduct != null &&
            !"APPROVED".equals(existingProduct.getStatus()) &&
            "APPROVED".equals(product.getStatus())) {
            approveProduct(product.getProductId());
            // Re-fetch the now-approved product and return it
            Product approved = productRepository.findById(product.getProductId()).orElse(null);
            populatePackages(approved);
            return approved;
        }

        // Recalculate stock weight from package breakdown
        if (product.getPackageBreakdown() != null && !product.getPackageBreakdown().isEmpty()) {
            int totalWeight = 0;
            for (com.scms.entity.ProductPackage pkg : product.getPackageBreakdown()) {
                totalWeight += pkg.getPackageSize() * pkg.getBagCount();
            }
            product.setStock(totalWeight);
        }

        // Recalculate selling price
        double purchasePrice = product.getPurchasePrice();
        String strategy = product.getPricingStrategy();
        double margin = product.getMarginValue();
        double sellingPrice = purchasePrice;

        if ("PROFIT_PERCENTAGE".equalsIgnoreCase(strategy)) {
            sellingPrice = purchasePrice * (1.0 + (margin / 100.0));
        } else if ("PROFIT_PER_KG".equalsIgnoreCase(strategy)) {
            sellingPrice = purchasePrice + margin;
        }
        product.setPrice(sellingPrice);

        Product saved = productRepository.save(product);

        // Update package breakdown: delete old records and save new ones
        if (product.getPackageBreakdown() != null) {
            productPackageRepository.deleteByProductId(saved.getProductId());
            for (com.scms.entity.ProductPackage pkg : product.getPackageBreakdown()) {
                pkg.setProductId(saved.getProductId());
                productPackageRepository.save(pkg);
            }
        }

        populatePackages(saved);
        return saved;
    }

    public void deleteProduct(int id) {
        productRepository.deleteById(id);
    }

    public List<Product> getProductsBySupplierId(int supplierId) {
        List<Product> products = productRepository.findBySupplierId(supplierId);
        products.forEach(this::populatePackages);
        return products;
    }

    public List<String> getApprovedProductNames() {
        return productRepository.findApprovedProductNames();
    }

    public List<String> getAllowedCategories() {
        return ALLOWED_CATEGORIES.stream().sorted().collect(Collectors.toList());
    }

    public List<Product> getProductsByName(String productName) {
        List<Integer> activeWarehouseIds = warehouseLocationRepository.findAll().stream()
            .filter(w -> "ACTIVE".equalsIgnoreCase(w.getStatus()))
            .map(com.scms.entity.WarehouseLocation::getId)
            .collect(Collectors.toList());

        List<Product> products = productRepository.findAll().stream()
                .filter(p -> p.getProductName().equalsIgnoreCase(productName) &&
                            "APPROVED".equalsIgnoreCase(p.getStatus()) &&
                            (p.getWarehouseId() == null || activeWarehouseIds.contains(p.getWarehouseId())))
                .collect(Collectors.toList());
        products.forEach(this::populatePackages);
        return products;
    }
}