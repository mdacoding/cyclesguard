package de.cyclesguard.ingestion.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Global rate limiting filter for the telemetry ingestion endpoint.
 * Prevents DDoS attacks and DB exhaustion using a Token Bucket algorithm.
 * Limit: 100 requests per second.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Bucket bucket;

    public RateLimitFilter() {
        // Refill 100 tokens per second, with a burst capacity of 100
        Bandwidth limit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofSeconds(1)));
        this.bucket = Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only apply rate limiting to the telemetry ingestion endpoint
        return !request.getRequestURI().startsWith("/api/v1/telemetry");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), "Rate limit exceeded (Max 100 req/sec)");
        }
    }
}
