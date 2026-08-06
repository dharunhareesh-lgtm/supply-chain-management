package com.scms.repository;

import com.scms.entity.VerificationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationAuditRepository extends JpaRepository<VerificationAudit, Long> {
    List<VerificationAudit> findByVerificationIdOrderByCreatedAtDesc(Long verificationId);
    List<VerificationAudit> findByEmailOrderByCreatedAtDesc(String email);
}
