package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.User;

public interface UserRepository
extends JpaRepository<User, Integer> {

User findByUsernameAndPassword(
    String username,
    String password);

User findByUsername(String username);

long countByRole(String role);
}