package com.scms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "search_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private Double searchRadiusKm = 100.0;
    private Double nearbyWarehouseDistanceKm = 50.0;
    private String preferredDistrict;
    private String preferredState;
}
