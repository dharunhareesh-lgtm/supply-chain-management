package com.scms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scms.dto.LocationSearchResult;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
public class LocationServiceImpl implements LocationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String USER_AGENT = "DravixScmApp/1.0 (contact: admin@dravixscm.com)";

    @Override
    public List<LocationSearchResult> search(String query) {
        if (query == null || query.trim().length() < 3) {
            return Collections.emptyList();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/search")
                    .queryParam("format", "json")
                    .queryParam("q", query.trim())
                    .queryParam("limit", 10)
                    .queryParam("addressdetails", 1)
                    .queryParam("countrycodes", "in")
                    .build().toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<LocationSearchResult> list = new ArrayList<>();
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.isArray()) {
                    for (JsonNode item : root) {
                        LocationSearchResult r = new LocationSearchResult();
                        r.setLat(item.path("lat").asDouble());
                        r.setLon(item.path("lon").asDouble());
                        r.setDisplayName(item.path("display_name").asText());
                        r.setName(item.path("name").asText(""));
                        r.setSource("nominatim");
                        r.setOsmId(item.path("osm_id").asLong(0));
                        r.setOsmType(item.path("osm_type").asText(""));

                        JsonNode addrNode = item.path("address");
                        LocationSearchResult.Address address = new LocationSearchResult.Address();
                        address.setVillage(addrNode.path("village").asText(addrNode.path("hamlet").asText(addrNode.path("suburb").asText(""))));
                        address.setDistrict(addrNode.path("district").asText(addrNode.path("city").asText(addrNode.path("county").asText(""))));
                        address.setState(addrNode.path("state").asText(""));
                        address.setPostcode(addrNode.path("postcode").asText(""));
                        address.setCountry(addrNode.path("country").asText(""));
                        r.setAddress(address);

                        list.add(r);
                    }
                }
                return list;
            }
        } catch (Exception e) {
            System.err.println("Nominatim search failed: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    @Override
    public LocationSearchResult reverse(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/reverse")
                    .queryParam("format", "json")
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .queryParam("addressdetails", 1)
                    .build().toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                LocationSearchResult result = new LocationSearchResult();
                result.setLat(root.path("lat").asDouble());
                result.setLon(root.path("lon").asDouble());
                result.setDisplayName(root.path("display_name").asText());
                result.setSource("nominatim");
                result.setOsmId(root.path("osm_id").asLong(0));
                result.setOsmType(root.path("osm_type").asText(""));

                JsonNode addrNode = root.path("address");
                LocationSearchResult.Address address = new LocationSearchResult.Address();
                address.setVillage(addrNode.path("village").asText(addrNode.path("hamlet").asText(addrNode.path("suburb").asText(""))));
                address.setDistrict(addrNode.path("district").asText(addrNode.path("city").asText(addrNode.path("county").asText(""))));
                address.setState(addrNode.path("state").asText(""));
                address.setPostcode(addrNode.path("postcode").asText(""));
                address.setCountry(addrNode.path("country").asText(""));
                result.setName(root.path("name").asText(address.getVillage()));
                result.setAddress(address);

                return result;
            }
        } catch (Exception e) {
            System.err.println("Nominatim reverse geocode failed: " + e.getMessage());
        }
        return null;
    }

    @Override
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public double calculateEstimatedTravelTime(double lat1, double lon1, double lat2, double lon2, double speedKmh) {
        double distance = calculateDistance(lat1, lon1, lat2, lon2);
        return distance / (speedKmh > 0 ? speedKmh : 40.0);
    }

    @Override
    public Object findNearestWarehouse(double latitude, double longitude) {
        return null;
    }

    @Override
    public Object findBestWarehouse(double latitude, double longitude, String cropCategory) {
        return null;
    }
}
