package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Supplier;

public interface SupplierRepository
        extends JpaRepository<Supplier, Integer> {

    Supplier findFirstByEmail(String email);

    Supplier findFirstByPhone(String phone);

    java.util.List<Supplier> findBySupplierType(String supplierType);

}