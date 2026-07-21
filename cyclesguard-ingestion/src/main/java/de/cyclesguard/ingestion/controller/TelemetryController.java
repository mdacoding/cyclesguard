package de.cyclesguard.ingestion.controller;

import de.cyclesguard.ingestion.dto.TelemetryPayload;
import de.cyclesguard.ingestion.queue.TelemetryQueue;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TelemetryController {

    private final TelemetryQueue telemetryQueue;

    public TelemetryController(TelemetryQueue telemetryQueue) {
        this.telemetryQueue = telemetryQueue;
    }

    @PostMapping("/telemetry")
    public ResponseEntity<Void> ingestTelemetry(@Valid @RequestBody TelemetryPayload payload) {
        if (!telemetryQueue.offer(payload)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/health/queue")
    public ResponseEntity<Map<String, Integer>> getQueueHealth() {
        return ResponseEntity.ok(Map.of("queueSize", telemetryQueue.size()));
    }
}
