package com.scms.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.scms.entity.Product;
import java.util.Objects;
import java.util.List;

import com.scms.repository.UserRepository;
import com.scms.repository.SupplierRepository;
import com.scms.repository.WarehouseLocationRepository;
import com.scms.repository.LogisticsCompanyRepository;
import com.scms.repository.ManagerRepository;
import com.scms.repository.ProductRepository;
import com.scms.repository.OrderRepository;
import com.scms.repository.LogisticsVehicleRepository;
import com.scms.repository.WarehouseCoverageRepository;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardStatisticsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private LogisticsVehicleRepository logisticsVehicleRepository;

    @Autowired
    private WarehouseCoverageRepository warehouseCoverageRepository;

    @GetMapping("/statistics")
    public Map<String, Object> getStatistics(@RequestParam(required = false) Integer warehouseId) {
        Map<String, Object> stats = new HashMap<>();
        
        long totalCustomers = userRepository.countByRole("CUSTOMER");
        long totalSuppliers;
        long totalProducts;
        long totalOrders;
        long completedOrders;

        if (warehouseId != null) {
            // Warehouse-specific counts
            List<Product> whProducts = productRepository.findByWarehouseId(warehouseId);
            totalProducts = whProducts.size();
            totalSuppliers = whProducts.stream()
                .map(Product::getSupplierId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
            totalOrders = orderRepository.countByWarehouseId(warehouseId);
            completedOrders = orderRepository.countByWarehouseIdAndStatusIgnoreCase(warehouseId, "Delivered");
        } else {
            // Global counts
            totalSuppliers = supplierRepository.count();
            totalProducts = productRepository.count();
            totalOrders = orderRepository.count();
            completedOrders = orderRepository.countByStatusIgnoreCase("Delivered");
        }

        long totalWarehouses = warehouseLocationRepository.count();
        long totalLogistics = logisticsCompanyRepository.count();
        long totalManagers = managerRepository.count();
        long activeVehicles = logisticsVehicleRepository.countByStatusIgnoreCase("Available");
        long coveredDistricts = warehouseCoverageRepository.countDistinctDistricts();

        stats.put("totalCustomers", totalCustomers);
        stats.put("totalSuppliers", totalSuppliers);
        stats.put("totalWarehouses", totalWarehouses);
        stats.put("totalLogisticsCompanies", totalLogistics);
        stats.put("totalWarehouseManagers", totalManagers);
        stats.put("totalProducts", totalProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("activeVehicles", activeVehicles);
        stats.put("registeredDistricts", coveredDistricts);

        return stats;
    }
}
