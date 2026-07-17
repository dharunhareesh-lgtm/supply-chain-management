package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.PlatformWallet;
import java.util.Optional;

public interface PlatformWalletRepository extends JpaRepository<PlatformWallet, Integer> {
    Optional<PlatformWallet> findByOwnerIdAndRole(int ownerId, String role);
}
