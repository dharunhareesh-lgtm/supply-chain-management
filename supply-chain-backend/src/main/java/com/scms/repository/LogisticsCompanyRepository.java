package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.LogisticsCompany;

public interface LogisticsCompanyRepository extends JpaRepository<LogisticsCompany, Integer> {
    LogisticsCompany findFirstByEmail(String email);
}
