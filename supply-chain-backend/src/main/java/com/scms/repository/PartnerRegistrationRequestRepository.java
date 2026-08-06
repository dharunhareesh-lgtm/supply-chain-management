package com.scms.repository;

import com.scms.entity.PartnerRegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnerRegistrationRequestRepository extends JpaRepository<PartnerRegistrationRequest, Long> {

    List<PartnerRegistrationRequest> findByStatus(String status);

    Optional<PartnerRegistrationRequest> findByEmail(String email);

    boolean existsByEmailAndStatus(String email, String status);

    long countByStatus(String status);

    List<PartnerRegistrationRequest> findAllByOrderBySubmittedAtDesc();
}
