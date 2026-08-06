package com.scms.repository;

import com.scms.entity.OcrExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OcrExtractionRepository extends JpaRepository<OcrExtraction, Long> {
    Optional<OcrExtraction> findByVerificationId(Long verificationId);
}
