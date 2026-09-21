package com.scms.repository;

import com.scms.entity.SupplierLandRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierLandRecordRepository extends JpaRepository<SupplierLandRecord, Long> {
    List<SupplierLandRecord> findBySupplierId(int supplierId);
    List<SupplierLandRecord> findByLandRecordId(Long landRecordId);
    boolean existsBySupplierIdAndLandRecordId(int supplierId, Long landRecordId);
}
