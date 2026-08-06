package com.scms.repository;

import com.scms.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    List<EmailOtp> findByEmailOrderByCreatedAtDesc(String email);
    Optional<EmailOtp> findFirstByEmailOrderByCreatedAtDesc(String email);
}
