package com.scms.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Manager;

public interface ManagerRepository
        extends JpaRepository<Manager, Integer> {
    Manager findByUsername(String username);
    Manager findByEmail(String email);
    Manager findByUsernameAndEmail(String username, String email);
}