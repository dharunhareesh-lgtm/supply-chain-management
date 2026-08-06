package com.scms.repository;

import com.scms.entity.VerificationDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, Long> {
    List<VerificationDocument> findByVerificationId(Long verificationId);
    java.util.List<VerificationDocument> findByDocumentHash(String documentHash);
}
