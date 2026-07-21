package de.cyclesguard.ingestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cyclesguard.queue")
public record QueueProperties(
        int capacity
) {
}
