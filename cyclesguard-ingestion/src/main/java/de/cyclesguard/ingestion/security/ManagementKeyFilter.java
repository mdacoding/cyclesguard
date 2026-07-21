package de.cyclesguard.ingestion.security;

import de.cyclesguard.ingestion.config.SecurityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Protects management endpoints with X-Management-Key (timing-safe).
 * Covers /api/v1/health/** and /api/v1/internal/**
 */
@Component
public class ManagementKeyFilter extends OncePerRequestFilter {

    private static final String MANAGEMENT_KEY_HEADER = "X-Management-Key";
    private final SecurityProperties securityProperties;

    public ManagementKeyFilter(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !(uri.startsWith("/api/v1/health") || uri.startsWith("/api/v1/internal"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String providedKey = request.getHeader(MANAGEMENT_KEY_HEADER);
        String expectedKey = securityProperties.managementApiKey();

        if (providedKey == null || providedKey.isBlank()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing X-Management-Key header");
            return;
        }

        boolean valid = MessageDigest.isEqual(
                expectedKey.getBytes(StandardCharsets.UTF_8),
                providedKey.getBytes(StandardCharsets.UTF_8)
        );

        if (!valid) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid management key");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
