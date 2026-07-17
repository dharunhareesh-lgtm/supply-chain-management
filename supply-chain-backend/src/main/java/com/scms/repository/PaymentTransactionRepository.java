package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.PaymentTransaction;
import java.util.List;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {
    List<PaymentTransaction> findByWalletId(int walletId);
}
