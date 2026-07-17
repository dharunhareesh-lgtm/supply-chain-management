package com.scms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.scms.entity.Supplier;
import com.scms.entity.User;
import com.scms.repository.SupplierRepository;
import com.scms.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private com.scms.repository.LogisticsCompanyRepository logisticsCompanyRepository;

    @Autowired
    private com.scms.repository.WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private com.scms.repository.ManagerRepository managerRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User login(
            String username,
            String password) {

        User user = userRepository.findByUsername(username);
        if (user != null) {
            if (passwordEncoder.matches(password, user.getPassword()) || password.equals(user.getPassword())) {
                return user;
            }
        }
        return null;
    }

    @Transactional
    public String registerSupplier(com.scms.dto.RegisterSupplierRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();
        String otp = request.getOtp();

        if (otp == null || !otpService.verifyOtp(email, otp)) {
            return "Invalid or Expired OTP";
        }

        Supplier supplier = supplierRepository.findFirstByEmail(email);
        if (supplier == null) {
            return "Supplier Not Found";
        }

        User existingUser = userRepository.findByUsername(email);
        if (existingUser != null) {
            return "Supplier Account Already Exists";
        }

        // Set Supplier location
        supplier.setLatitude(request.getLatitude());
        supplier.setLongitude(request.getLongitude());
        supplier.setAddress(request.getAddress());
        supplier.setDistrict(request.getDistrict());
        supplier.setState(request.getState());

        // Auto-assign nearest warehouse
        if (request.getLatitude() != null && request.getLongitude() != null) {
            java.util.List<com.scms.entity.WarehouseLocation> warehouses = warehouseLocationRepository.findAll();
            com.scms.entity.WarehouseLocation nearest = null;
            double minDist = Double.MAX_VALUE;
            for (com.scms.entity.WarehouseLocation wl : warehouses) {
                if (!"ACTIVE".equalsIgnoreCase(wl.getStatus())) continue;
                if (wl.getLatitude() == null || wl.getLongitude() == null) continue;
                double dist = com.scms.util.HaversineUtil.calculateDistance(
                        request.getLatitude(), request.getLongitude(),
                        wl.getLatitude(), wl.getLongitude());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = wl;
                }
            }
            if (nearest != null) {
                supplier.setWarehouseId(nearest.getId());
            }
        }
        supplierRepository.save(supplier);

        User user = new User();
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("SUPPLIER");
        user.setSupplierId(supplier.getSupplierId());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setAddress(request.getAddress());
        user.setDistrict(request.getDistrict());
        user.setState(request.getState());
        user.setCountry(request.getCountry());
        user.setPostalCode(request.getPostalCode());

        userRepository.save(user);
        otpService.deleteOtp(email);

        return "Supplier Registered Successfully";
    }

    @Transactional
    public String registerCustomer(com.scms.dto.RegisterCustomerRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        String otp = request.getOtp();

        if (otp == null || !otpService.verifyOtp(username, otp)) {
            return "Invalid or Expired OTP";
        }

        User existingUser = userRepository.findByUsername(username);
        if (existingUser != null) {
            return "Customer Already Exists";
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("CUSTOMER");
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setAddress(request.getAddress());
        user.setDistrict(request.getDistrict());
        user.setState(request.getState());
        user.setCountry(request.getCountry());
        user.setPostalCode(request.getPostalCode());

        userRepository.save(user);
        otpService.deleteOtp(username);

        return "Customer Registered Successfully";
    }

    @Transactional
    public String registerLogistics(String email, String password, String otp) {
        if (otp == null || !otpService.verifyOtp(email, otp)) {
            return "Invalid or Expired OTP";
        }

        com.scms.entity.LogisticsCompany company = logisticsCompanyRepository.findFirstByEmail(email);
        if (company == null) {
            return "Logistics Company Not Found";
        }

        User existingUser = userRepository.findByUsername(email);
        if (existingUser != null) {
            return "Logistics Account Already Exists";
        }

        User user = new User();
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("LOGISTICS");
        userRepository.save(user);
        otpService.deleteOtp(email);

        return "Logistics Registered Successfully";
    }

    @Transactional
    public String registerWarehouse(String email, String password, String otp) {
        if (otp == null || !otpService.verifyOtp(email, otp)) {
            return "Invalid or Expired OTP";
        }

        com.scms.entity.WarehouseLocation warehouse = warehouseLocationRepository.findByRegisteredEmail(email).orElse(null);
        if (warehouse == null) {
            return "Warehouse Not Found";
        }

        User existingUser = userRepository.findByUsername(email);
        if (existingUser != null) {
            return "Warehouse Account Already Exists";
        }

        User user = new User();
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("WAREHOUSE");
        userRepository.save(user);

        com.scms.entity.Manager manager = managerRepository.findByUsername(email);
        if (manager == null) {
            manager = new com.scms.entity.Manager();
            manager.setUsername(email);
            manager.setEmail(email);
            manager.setPassword(passwordEncoder.encode(password));
            manager.setCategory("Warehouse");
            manager.setStatus("ACTIVE");
            manager.setIsWarehouseAccount(true);
            manager.setWarehouseId(warehouse.getId());
            managerRepository.save(manager);
        } else {
            manager.setPassword(passwordEncoder.encode(password));
            manager.setStatus("ACTIVE");
            manager.setIsWarehouseAccount(true);
            manager.setWarehouseId(warehouse.getId());
            managerRepository.save(manager);
        }

        otpService.deleteOtp(email);
        return "Warehouse Registered Successfully";
    }
}