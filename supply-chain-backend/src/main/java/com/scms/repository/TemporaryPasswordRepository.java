package com.scms.repository;

import com.scms.entity.TemporaryPassword;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemporaryPasswordRepository extends JpaRepository<TemporaryPassword, Long> {

    Optional<TemporaryPassword> findByUserIdAndActiveTrue(Integer userId);

    List<TemporaryPassword> findByUserId(Integer userId);
}
