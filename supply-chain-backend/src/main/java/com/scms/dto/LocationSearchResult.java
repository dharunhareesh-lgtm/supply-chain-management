package com.scms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LocationSearchResult {

    private Double lat;
    private Double lon;

    @JsonProperty("display_name")
    private String displayName;

    private String name;
    private Address address;
    private String source;

    @JsonProperty("osm_id")
    private Long osmId;

    @JsonProperty("osm_type")
    private String osmType;

    public LocationSearchResult() {
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLon() {
        return lon;
    }

    public void setLon(Double lon) {
        this.lon = lon;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Long getOsmId() {
        return osmId;
    }

    public void setOsmId(Long osmId) {
        this.osmId = osmId;
    }

    public String getOsmType() {
        return osmType;
    }

    public void setOsmType(String osmType) {
        this.osmType = osmType;
    }

    public static class Address {
        private String village;
        private String revenueVillage;
        private String hamlet;
        private String panchayat;
        private String taluk;
        private String district;
        private String state;
        private String postcode;
        private String road;
        private String street;
        private String landmark;
        private String country;

        public Address() {
        }

        public String getVillage() {
            return village;
        }

        public void setVillage(String village) {
            this.village = village;
        }

        public String getRevenueVillage() {
            return revenueVillage;
        }

        public void setRevenueVillage(String revenueVillage) {
            this.revenueVillage = revenueVillage;
        }

        public String getHamlet() {
            return hamlet;
        }

        public void setHamlet(String hamlet) {
            this.hamlet = hamlet;
        }

        public String getPanchayat() {
            return panchayat;
        }

        public void setPanchayat(String panchayat) {
            this.panchayat = panchayat;
        }

        public String getTaluk() {
            return taluk;
        }

        public void setTaluk(String taluk) {
            this.taluk = taluk;
        }

        public String getDistrict() {
            return district;
        }

        public void setDistrict(String district) {
            this.district = district;
        }

        public String getState() {
            return state;
        }

        public void setState(String state) {
            this.state = state;
        }

        public String getPostcode() {
            return postcode;
        }

        public void setPostcode(String postcode) {
            this.postcode = postcode;
        }

        public String getRoad() {
            return road;
        }

        public void setRoad(String road) {
            this.road = road;
        }

        public String getStreet() {
            return street;
        }

        public void setStreet(String street) {
            this.street = street;
        }

        public String getLandmark() {
            return landmark;
        }

        public void setLandmark(String landmark) {
            this.landmark = landmark;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }
    }
}
