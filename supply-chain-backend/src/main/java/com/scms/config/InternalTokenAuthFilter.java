package com.scms.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class InternalTokenAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        if (path.startsWith("/api/internal/")) {
            String requestToken = request.getHeader("X-Internal-Token");
            String internalToken = System.getProperty("INTERNAL_SCHEDULER_TOKEN");
            if (internalToken == null) {
                internalToken = System.getenv("INTERNAL_SCHEDULER_TOKEN");
            }

            if (internalToken == null || internalToken.trim().isEmpty() || !internalToken.equals(requestToken)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Unauthorized: Invalid or missing token.");
                return;
            }

            // Grant auth access
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "INTERNAL_SCHEDULER", null, Collections.emptyList()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
