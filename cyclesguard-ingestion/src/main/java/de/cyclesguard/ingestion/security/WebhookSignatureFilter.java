package de.cyclesguard.ingestion.security;

import de.cyclesguard.ingestion.config.WebhookProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class WebhookSignatureFilter extends OncePerRequestFilter {

    private final WebhookProperties webhookProperties;
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_HEADER = "X-Webhook-Signature";

    public WebhookSignatureFilter(WebhookProperties webhookProperties) {
        this.webhookProperties = webhookProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/telemetry");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Wrap first — this wrapper caches whatever is read from its InputStream.
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);

        // Eagerly consume the body NOW so the cache is populated before we
        // validate and before the controller tries to read it.
        // The wrapper re-serves the cached bytes to all subsequent readers.
        byte[] body = wrappedRequest.getInputStream().readAllBytes();

        String signatureHeader = wrappedRequest.getHeader(SIGNATURE_HEADER);
        if (signatureHeader == null || signatureHeader.isBlank()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing X-Webhook-Signature header");
            return;
        }

        String computedSignature = computeHmacSha256Hex(body);

        // MessageDigest.isEqual is timing-safe: prevents timing-attack side-channels
        // that would allow an attacker to brute-force the HMAC secret.
        if (!MessageDigest.isEqual(
                computedSignature.getBytes(StandardCharsets.UTF_8),
                signatureHeader.getBytes(StandardCharsets.UTF_8))) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid signature");
            return;
        }

        filterChain.doFilter(wrappedRequest, response);
    }

    /**
     * Computes HMAC-SHA256 of {@code payload} using the configured webhook secret
     * and returns the result as a lowercase hex string.
     */
    private String computeHmacSha256Hex(byte[] payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec keySpec = new SecretKeySpec(
                    webhookProperties.secret().getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload);

            // %02x produces zero-padded lowercase hex for every byte
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 computation failed — check security provider", e);
        }
    }
}
