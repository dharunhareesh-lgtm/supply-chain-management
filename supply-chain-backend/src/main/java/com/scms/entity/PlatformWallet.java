package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "platform_wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlatformWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int ownerId; // Supplier ID, Warehouse ID, Logistics ID, or 0 for Platform
    private String role; // SUPPLIER, WAREHOUSE, LOGISTICS, PLATFORM
    private double balance;
    private String lastUpdated = java.time.LocalDateTime.now().toString();
}
