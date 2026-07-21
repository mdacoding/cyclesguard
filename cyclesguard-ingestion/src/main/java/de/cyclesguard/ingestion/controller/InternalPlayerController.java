package de.cyclesguard.ingestion.controller;

import de.cyclesguard.ingestion.dto.PlayerRegistryRequest;
import de.cyclesguard.ingestion.dto.SessionAggregateDto;
import de.cyclesguard.ingestion.entity.GpsMetric;
import de.cyclesguard.ingestion.entity.PlayerRegistry;
import de.cyclesguard.ingestion.repository.GpsMetricRepository;
import de.cyclesguard.ingestion.repository.GpsQuarantineRepository;
import de.cyclesguard.ingestion.repository.PlayerRegistryRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/internal")
public class InternalPlayerController {

    private final GpsMetricRepository gpsMetricRepository;
    private final GpsQuarantineRepository gpsQuarantineRepository;
    private final PlayerRegistryRepository playerRegistryRepository;

    public InternalPlayerController(
            GpsMetricRepository gpsMetricRepository,
            GpsQuarantineRepository gpsQuarantineRepository,
            PlayerRegistryRepository playerRegistryRepository) {
        this.gpsMetricRepository = gpsMetricRepository;
        this.gpsQuarantineRepository = gpsQuarantineRepository;
        this.playerRegistryRepository = playerRegistryRepository;
    }

    @DeleteMapping("/players/{playerId}")
    public ResponseEntity<Void> deletePlayerData(@PathVariable UUID playerId) {
        gpsMetricRepository.deleteByPlayerId(playerId);
        gpsQuarantineRepository.deleteByPlayerId(playerId);
        playerRegistryRepository.deleteById(playerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/players/registry")
    public ResponseEntity<Void> upsertRegistry(@Valid @RequestBody PlayerRegistryRequest request) {
        playerRegistryRepository.save(PlayerRegistry.builder()
                .playerId(request.playerId())
                .externalAthleteId(request.externalAthleteId())
                .provider(request.provider() != null ? request.provider() : "default")
                .build());
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/session-aggregates")
    public ResponseEntity<List<SessionAggregateDto>> sessionAggregates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {

        List<GpsMetric> metrics = gpsMetricRepository.findSince(since);
        Map<String, List<GpsMetric>> grouped = new LinkedHashMap<>();
        for (GpsMetric m : metrics) {
            String key = m.getPlayerId() + "_" + m.getSessionId();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(m);
        }

        List<SessionAggregateDto> result = new ArrayList<>();
        for (List<GpsMetric> session : grouped.values()) {
            session.sort(Comparator.comparing(GpsMetric::getRecordedAt));
            GpsMetric first = session.get(0);
            GpsMetric last = session.get(session.size() - 1);
            long minutes = Math.max(1, Duration.between(first.getRecordedAt(), last.getRecordedAt()).toMinutes());

            double distance = 0;
            for (int i = 1; i < session.size(); i++) {
                distance += haversine(
                        session.get(i - 1).getLatitude(), session.get(i - 1).getLongitude(),
                        session.get(i).getLatitude(), session.get(i).getLongitude());
            }

            OptionalDouble avgHr = session.stream()
                    .map(GpsMetric::getHeartRate)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .average();

            OptionalDouble maxSpeed = session.stream()
                    .map(GpsMetric::getSpeedKmh)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .max();

            double loadScore = distance * 10 + (avgHr.isPresent() ? avgHr.getAsDouble() / 10.0 : 0);

            result.add(new SessionAggregateDto(
                    first.getPlayerId(),
                    first.getSessionId(),
                    first.getRecordedAt(),
                    (int) minutes,
                    distance,
                    avgHr.isPresent() ? (int) Math.round(avgHr.getAsDouble()) : null,
                    maxSpeed.isPresent() ? maxSpeed.getAsDouble() : null,
                    loadScore
            ));
        }

        return ResponseEntity.ok(result);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
