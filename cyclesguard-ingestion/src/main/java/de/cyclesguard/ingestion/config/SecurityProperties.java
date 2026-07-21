package de.cyclesguard.ingestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "cyclesguard.security")
public record SecurityProperties(
        String managementApiKey,
        List<String> allowedOrigins
) {
}
