package de.cyclesguard.ingestion.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import de.cyclesguard.ingestion.security.AuditLoggingFilter;
import de.cyclesguard.ingestion.security.RateLimitFilter;

/**
 * Spring Security configuration for the CyclesGuard Ingestion Service.
 *
 * Security model:
 * - /api/v1/telemetry   → HMAC-SHA256 filter (WebhookSignatureFilter), permitAll at Spring Security level
 * - /api/v1/health/**  → ManagementKeyFilter handles auth, permitAll at Spring Security level
 * - All other paths    → denyAll by default
 * - Session: STATELESS (REST API, no cookies)
 * - CSRF: disabled (stateless REST API with HMAC auth)
 * - CORS: restricted to configured allowed origins
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties({SecurityProperties.class, WebhookProperties.class, QueueProperties.class, CleansingProperties.class})
public class SecurityConfig {

    private final SecurityProperties securityProperties;
    private final RateLimitFilter rateLimitFilter;
    private final AuditLoggingFilter auditLoggingFilter;

    public SecurityConfig(SecurityProperties securityProperties, 
                          RateLimitFilter rateLimitFilter, 
                          AuditLoggingFilter auditLoggingFilter) {
        this.securityProperties = securityProperties;
        this.rateLimitFilter = rateLimitFilter;
        this.auditLoggingFilter = auditLoggingFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF: REST API uses HMAC/API Key authentication, not cookies
            .csrf(AbstractHttpConfigurer::disable)

            // CORS: only allow requests from configured frontend origins
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management: stateless (no HttpSession)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Register custom security and audit filters
            .addFilterBefore(rateLimitFilter, org.springframework.security.web.context.SecurityContextHolderFilter.class)
            .addFilterBefore(auditLoggingFilter, org.springframework.security.web.context.SecurityContextHolderFilter.class)

            // Authorization rules:
            // The WebhookSignatureFilter and ManagementKeyFilter handle actual
            // authentication. Spring Security only controls access at a higher level.
            .authorizeHttpRequests(auth -> auth
                // Telemetry endpoint: authenticated by WebhookSignatureFilter
                .requestMatchers("/api/v1/telemetry").permitAll()
                // Health + internal ops: authenticated by ManagementKeyFilter
                .requestMatchers("/api/v1/health/**").permitAll()
                .requestMatchers("/api/v1/internal/**").permitAll()
                // Spring Actuator health endpoint (no sensitive info)
                .requestMatchers("/actuator/health").permitAll()
                // Everything else is denied
                .anyRequest().denyAll()
            )

            // Disable HTTP Basic Auth (we use custom filters)
            .httpBasic(AbstractHttpConfigurer::disable)

            // Disable form login
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Only allow explicitly configured origins (no wildcard in production)
        config.setAllowedOrigins(securityProperties.allowedOrigins());
        config.setAllowedMethods(List.of("POST", "GET", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
            "Content-Type",
            "X-Webhook-Signature",
            "X-Management-Key"
        ));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
