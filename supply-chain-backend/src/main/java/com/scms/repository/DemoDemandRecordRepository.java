package com.scms.repository;

import com.scms.entity.DemoDemandRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemoDemandRecordRepository extends JpaRepository<DemoDemandRecord, Long> {

    List<DemoDemandRecord> findByProductIdOrderByPeriodAsc(Integer productId);

    List<DemoDemandRecord> findByProductNameIgnoreCaseOrderByPeriodAsc(String productName);

    long countByProductId(Integer productId);
}
