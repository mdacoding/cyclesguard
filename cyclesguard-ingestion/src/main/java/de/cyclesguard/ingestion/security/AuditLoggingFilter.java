package de.cyclesguard.ingestion.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

/**
 * Audit log for management endpoints.
 * Logs access to /api/v1/health to ensure traceability of administrative actions.
 */
@Component
@Slf4j
public class AuditLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        filterChain.doFilter(request, response);

        // Log AFTER the request completes to capture the response status
        String ipAddress = request.getRemoteAddr();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String finalIp = (forwardedFor != null && !forwardedFor.isBlank()) ? forwardedFor : ipAddress;
        
        log.info("AUDIT: Management API Access | URI: {} | Method: {} | IP: {} | Status: {} | Time: {}",
                request.getRequestURI(),
                request.getMethod(),
                finalIp,
                response.getStatus(),
                Instant.now());
    }
}
