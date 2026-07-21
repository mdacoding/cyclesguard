package de.cyclesguard.ingestion.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record TelemetryPayload(
        @NotEmpty @Valid List<GpsDataPoint> dataPoints
) {
}
