package de.cyclesguard.ingestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cyclesguard.webhook")
public record WebhookProperties(
        String secret
) {
}
