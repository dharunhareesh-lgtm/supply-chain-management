package com.scms.repository;

import com.scms.entity.DocumentViewConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentViewConsentRepository extends JpaRepository<DocumentViewConsent, Long> {

    // Fetch all pending consent requests for a customer (shown on customer's KYC page)
    List<DocumentViewConsent> findByCustomerEmailAndStatusOrderByRequestedAtDesc(String customerEmail, String status);

    // Fetch all pending requests sent by a specific admin
    List<DocumentViewConsent> findByAdminEmailAndVerificationDocumentIdAndStatus(
            String adminEmail, Long verificationDocumentId, String status);

    // Get the latest consent for a given doc + admin
    Optional<DocumentViewConsent> findFirstByAdminEmailAndVerificationDocumentIdOrderByRequestedAtDesc(
            String adminEmail, Long verificationDocumentId);

    // All consent requests for a customer regardless of status
    List<DocumentViewConsent> findByCustomerEmailOrderByRequestedAtDesc(String customerEmail);

    // Find consents for a document by status
    List<DocumentViewConsent> findByVerificationDocumentIdAndStatusOrderByRequestedAtDesc(
            Long verificationDocumentId, String status);
}
