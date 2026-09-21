package com.scms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${scms.cors.allowed-origins:}")
    private String allowedOrigins;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/internal/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(new InternalTokenAuthFilter(), org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        
        String allowedOriginsProp = allowedOrigins;
        if (allowedOriginsProp == null || allowedOriginsProp.trim().isEmpty()) {
            allowedOriginsProp = System.getenv("SCMS_CORS_ALLOWED_ORIGINS");
        }
        
        if (allowedOriginsProp == null || allowedOriginsProp.trim().isEmpty()) {
            configuration.setAllowedOrigins(java.util.List.of("http://localhost:3000", "http://localhost:5173", "http://localhost:8080"));
        } else {
            java.util.List<String> origins = java.util.stream.Stream.of(allowedOriginsProp.split(","))
                    .map(String::trim)
                    .collect(java.util.stream.Collectors.toList());
            configuration.setAllowedOrigins(origins);
        }
        
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "X-Internal-Token", "X-User-Email", "Accept", "Origin"));
        configuration.setExposedHeaders(java.util.List.of("Authorization"));
        configuration.setAllowCredentials(true);
        
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public org.springframework.security.core.userdetails.UserDetailsService userDetailsService() {
        return new org.springframework.security.provisioning.InMemoryUserDetailsManager();
    }
}
