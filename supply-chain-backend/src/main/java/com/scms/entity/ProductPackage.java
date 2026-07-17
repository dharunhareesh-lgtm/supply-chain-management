package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "product_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int productId;
    private int packageSize; // e.g. 25, 50, 60, 100
    private int bagCount; // e.g. number of bags of this size
}
