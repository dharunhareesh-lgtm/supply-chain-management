package com.scms.repository;

import com.scms.entity.OrderDeliveryOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderDeliveryOtpRepository extends JpaRepository<OrderDeliveryOtp, Long> {

    /** Fetch the latest OTP record for a given order and OTP type (DISPATCH/DELIVERY) */
    Optional<OrderDeliveryOtp> findTopByOrderIdAndOtpTypeOrderByCreatedAtDesc(Integer orderId, String otpType);

    /** Fetch all OTP records for a given order and type */
    List<OrderDeliveryOtp> findByOrderIdAndOtpType(Integer orderId, String otpType);

    /** Fetch all OTPs for a given order */
    List<OrderDeliveryOtp> findByOrderId(Integer orderId);
}
