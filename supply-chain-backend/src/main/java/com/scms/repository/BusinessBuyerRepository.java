package com.scms.repository;

import com.scms.entity.BusinessBuyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessBuyerRepository extends JpaRepository<BusinessBuyer, Long> {
    Optional<BusinessBuyer> findByEmail(String email);
    boolean existsByEmail(String email);
}
