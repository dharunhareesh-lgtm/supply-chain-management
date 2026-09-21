package com.scms.repository;

import com.scms.entity.FpoDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FpoDocumentRepository extends JpaRepository<FpoDocument, Long> {

    List<FpoDocument> findBySupplierId(int supplierId);

    List<FpoDocument> findByVerificationStatus(String verificationStatus);

    Optional<FpoDocument> findFirstBySupplierIdOrderByUploadedAtDesc(int supplierId);

    Optional<FpoDocument> findFirstByDocumentUrl(String documentUrl);

    Optional<FpoDocument> findFirstByOriginalFileNameOrderByUploadedAtDesc(String originalFileName);
}
