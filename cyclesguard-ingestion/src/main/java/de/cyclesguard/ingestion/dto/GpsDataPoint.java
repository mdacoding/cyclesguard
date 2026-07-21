package de.cyclesguard.ingestion.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record GpsDataPoint(
        @NotNull UUID playerId,
        @NotNull UUID sessionId,
        @NotNull Instant recordedAt,
        @NotNull Double latitude,
        @NotNull Double longitude,
        Integer heartRate,
        Double speedKmh
) {
}
