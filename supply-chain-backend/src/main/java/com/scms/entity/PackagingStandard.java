package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "packaging_standards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PackagingStandard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(unique = true)
    private int size; // e.g. 25, 50, 60, 100

    private boolean active = true;
}
