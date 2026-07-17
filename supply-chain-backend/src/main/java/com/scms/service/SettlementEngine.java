package com.scms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.scms.entity.*;
import com.scms.repository.*;

import java.time.LocalDateTime;

@Service
public class SettlementEngine {

    @Autowired
    private PlatformWalletRepository walletRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    public void distributeRevenue(Order order) {
        // Prevent double creation
        if (!settlementRepository.findByOrderId(order.getOrderId()).isEmpty()) {
            return;
        }

        double grossRevenue = order.getGrossRevenue() != null ? order.getGrossRevenue() : 0.0;
        double warehouseDeduction = order.getWarehouseDeduction() != null ? order.getWarehouseDeduction() : 0.0;
        double deliveryCharge = order.getFinalDeliveryCharge() != null ? order.getFinalDeliveryCharge() : 0.0;
        if (deliveryCharge <= 0 && "PLATFORM_LOGISTICS".equalsIgnoreCase(order.getDeliveryOption())) {
            deliveryCharge = order.getEstimatedDeliveryCharge() != null ? order.getEstimatedDeliveryCharge() : 0.0;
        }

        // Calculations
        double supplierAmount = grossRevenue - warehouseDeduction;
        double warehouseAmount = warehouseDeduction;
        double logisticsAmount = "PLATFORM_LOGISTICS".equalsIgnoreCase(order.getDeliveryOption()) ? deliveryCharge : 0.0;
        double platformFee = grossRevenue * 0.01; // 1% platform service fee

        // Adjust supplier amount to deduct platform fee
        supplierAmount = Math.max(0.0, supplierAmount - platformFee);

        // Create PENDING_DISTRIBUTION Settlement Record (Held in Platform Wallet escrow)
        Settlement settlement = new Settlement();
        settlement.setOrderId(order.getOrderId());
        settlement.setSupplierId(order.getSupplierId());
        settlement.setWarehouseId(order.getWarehouseId());
        settlement.setLogisticsId(order.getLogisticsId());
        settlement.setSupplierAmount(round(supplierAmount));
        settlement.setWarehouseAmount(round(warehouseAmount));
        settlement.setLogisticsAmount(round(logisticsAmount));
        settlement.setPlatformFee(round(platformFee));
        settlement.setStatus("PENDING_DISTRIBUTION");
        settlement.setSettledAt(LocalDateTime.now().toString().substring(0, 10));
        settlement.setPaymentMethod(order.getPaymentMethod());
        
        settlementRepository.save(settlement);

        order.setSettlementStatus("PENDING_DISTRIBUTION");
        orderRepository.save(order);
    }

    @Transactional
    public void executeWalletDistribution(Settlement settlement) {
        Order order = orderRepository.findById(settlement.getOrderId()).orElse(null);
        if (order == null) return;

        // Perform actual credits to supplier, warehouse, and logistics wallets from Platform escrow
        updateWallet(settlement.getSupplierId(), "SUPPLIER", settlement.getSupplierAmount(), "Revenue payout for Order ORD-" + String.format("%04d", order.getOrderId()));
        updateWallet(settlement.getWarehouseId(), "WAREHOUSE", settlement.getWarehouseAmount(), "Storage commission for Order ORD-" + String.format("%04d", order.getOrderId()));
        
        if (settlement.getLogisticsId() != null && "PLATFORM_LOGISTICS".equalsIgnoreCase(order.getDeliveryOption())) {
            updateWallet(settlement.getLogisticsId(), "LOGISTICS", settlement.getLogisticsAmount(), "Freight payout for Order ORD-" + String.format("%04d", order.getOrderId()));
        }
        
        updateWallet(0, "PLATFORM", settlement.getPlatformFee(), "Platform fee from Order ORD-" + String.format("%04d", order.getOrderId()));

        // Mark as Distributed
        settlement.setStatus("DISTRIBUTED");
        settlement.setDistributionDate(LocalDateTime.now().toString().substring(0, 10));
        settlement.setDistributedBy("Admin");
        settlementRepository.save(settlement);

        order.setSettlementStatus("REVENUE_DISTRIBUTED");
        orderRepository.save(order);
    }

    private void updateWallet(int ownerId, String role, double amount, String description) {
        PlatformWallet wallet = walletRepository.findByOwnerIdAndRole(ownerId, role)
                .orElseGet(() -> {
                    PlatformWallet newWallet = new PlatformWallet();
                    newWallet.setOwnerId(ownerId);
                    newWallet.setRole(role);
                    newWallet.setBalance(0.0);
                    return walletRepository.save(newWallet);
                });

        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setLastUpdated(LocalDateTime.now().toString());
        walletRepository.save(wallet);

        // Record Transaction
        PaymentTransaction txn = new PaymentTransaction();
        txn.setWalletId(wallet.getId());
        txn.setTxnType("CREDIT");
        txn.setAmount(amount);
        txn.setDescription(description);
        txn.setTimestamp(LocalDateTime.now().toString());
        transactionRepository.save(txn);
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
