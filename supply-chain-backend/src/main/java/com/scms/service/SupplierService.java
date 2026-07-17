package com.scms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.Supplier;
import com.scms.repository.SupplierRepository;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier addSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }
    
    public Supplier getSupplierById(int id) {
        return supplierRepository.findById(id).orElse(null);
    }

    public void deleteSupplier(int id) {
        supplierRepository.deleteById(id);
    }
}