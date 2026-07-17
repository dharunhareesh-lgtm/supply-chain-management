package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Payment;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByOrderId(int orderId);
}
