package com.scms.repository;

import com.scms.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Integer> {
    long countByEmailAndCreatedTimeAfter(String email, LocalDateTime time);
    Optional<PasswordResetOtp> findFirstByEmailOrderByCreatedTimeDesc(String email);
}
