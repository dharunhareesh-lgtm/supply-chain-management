package com.scms.repository;

import com.scms.entity.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {
    Optional<CustomerProfile> findByEmail(String email);
    Optional<CustomerProfile> findByPanNumber(String panNumber);
    boolean existsByPanNumber(String panNumber);
    boolean existsByEmail(String email);
}
