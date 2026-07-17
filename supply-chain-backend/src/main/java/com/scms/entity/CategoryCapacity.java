package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "category_capacity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryCapacity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int capacityId;

    private String category;

    private int maxCapacity;

    private int usedCapacity;

    private Integer warehouseId;
}