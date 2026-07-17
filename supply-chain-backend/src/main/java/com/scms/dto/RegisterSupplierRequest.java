package com.scms.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterSupplierRequest {

    private String email;
    private String password;
    private String otp;
    private Double latitude;
    private Double longitude;
    private String address;
    private String district;
    private String state;
    private String country;
    private String postalCode;
}