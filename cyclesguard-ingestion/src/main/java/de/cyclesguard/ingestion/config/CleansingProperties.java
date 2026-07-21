package de.cyclesguard.ingestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cyclesguard.cleansing")
public record CleansingProperties(
        double emaAlpha,
        int maxHeartRate,
        int minHeartRate,
        double maxSpeedKmh,
        int maxTimestampGapSeconds
) {
}
