package com.scms.repository;

import com.scms.entity.CustomerVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerVerificationRepository extends JpaRepository<CustomerVerification, Long> {
    List<CustomerVerification> findByEmailOrderByCreatedAtDesc(String email);
    Optional<CustomerVerification> findFirstByEmailOrderByCreatedAtDesc(String email);
    List<CustomerVerification> findByStatusOrderByCreatedAtDesc(String status);
    List<CustomerVerification> findAllByOrderByCreatedAtDesc();
}
