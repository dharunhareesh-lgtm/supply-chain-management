package com.scms.service;

import com.scms.dto.LocationSearchResult;
import java.util.List;

public interface LocationService {
    List<LocationSearchResult> search(String query);
    LocationSearchResult reverse(Double latitude, Double longitude);
    double calculateDistance(double lat1, double lon1, double lat2, double lon2);
    double calculateEstimatedTravelTime(double lat1, double lon1, double lat2, double lon2, double speedKmh);
    Object findNearestWarehouse(double latitude, double longitude);
    Object findBestWarehouse(double latitude, double longitude, String cropCategory);
}
