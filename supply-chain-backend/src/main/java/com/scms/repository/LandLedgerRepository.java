package com.scms.repository;

import com.scms.entity.LandLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandLedgerRepository extends JpaRepository<LandLedger, Long> {
    Optional<LandLedger> findByLandRecordId(Long landRecordId);
}
