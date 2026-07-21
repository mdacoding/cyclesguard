package de.cyclesguard.ingestion.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionAggregateDto(
        UUID playerId,
        UUID sessionId,
        Instant startedAt,
        int durationMinutes,
        double distanceKm,
        Integer avgHeartRate,
        Double maxSpeedKmh,
        double loadScore
) {
}
