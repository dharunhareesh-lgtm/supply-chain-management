package com.scms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.scms.entity.Delivery;

public interface DeliveryRepository
        extends JpaRepository<Delivery, Integer> {
    java.util.List<Delivery> findByOrderId(int orderId);
}