package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.OtpEntity;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpEntity, Integer> {
    Optional<OtpEntity> findByEmail(String email);
    void deleteByEmail(String email);
}
