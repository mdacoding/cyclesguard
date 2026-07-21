package de.cyclesguard.ingestion.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PlayerRegistryRequest(
        @NotNull UUID playerId,
        String externalAthleteId,
        String provider
) {
}
