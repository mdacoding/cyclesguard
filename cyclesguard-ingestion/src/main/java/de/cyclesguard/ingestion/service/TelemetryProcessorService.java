package de.cyclesguard.ingestion.service;

import de.cyclesguard.ingestion.dto.GpsDataPoint;
import de.cyclesguard.ingestion.dto.TelemetryPayload;
import de.cyclesguard.ingestion.entity.GpsMetricQuarantine;
import de.cyclesguard.ingestion.queue.TelemetryQueue;
import de.cyclesguard.ingestion.repository.GpsMetricRepository;
import de.cyclesguard.ingestion.repository.GpsQuarantineRepository;
import de.cyclesguard.ingestion.repository.PlayerRegistryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TelemetryProcessorService {

    private final TelemetryQueue telemetryQueue;
    private final DataCleansingService dataCleansingService;
    private final GpsMetricRepository gpsMetricRepository;
    private final GpsQuarantineRepository gpsQuarantineRepository;
    private final PlayerRegistryRepository playerRegistryRepository;

    public TelemetryProcessorService(
            TelemetryQueue telemetryQueue,
            DataCleansingService dataCleansingService,
            GpsMetricRepository gpsMetricRepository,
            GpsQuarantineRepository gpsQuarantineRepository,
            PlayerRegistryRepository playerRegistryRepository) {
        this.telemetryQueue = telemetryQueue;
        this.dataCleansingService = dataCleansingService;
        this.gpsMetricRepository = gpsMetricRepository;
        this.gpsQuarantineRepository = gpsQuarantineRepository;
        this.playerRegistryRepository = playerRegistryRepository;
    }

    @Scheduled(fixedDelayString = "500")
    @Transactional
    public void processQueue() {
        List<TelemetryPayload> payloads = telemetryQueue.drain(500);
        if (payloads.isEmpty()) {
            return;
        }

        List<GpsDataPoint> allPoints = payloads.stream()
                .flatMap(p -> p.dataPoints().stream())
                .collect(Collectors.toList());

        boolean enforceRegistry = playerRegistryRepository.count() > 0;
        List<GpsDataPoint> accepted = new ArrayList<>();
        List<GpsMetricQuarantine> unknownPlayers = new ArrayList<>();

        for (GpsDataPoint point : allPoints) {
            if (enforceRegistry && !playerRegistryRepository.existsByPlayerId(point.playerId())) {
                unknownPlayers.add(GpsMetricQuarantine.builder()
                        .playerId(point.playerId())
                        .sessionId(point.sessionId())
                        .rawPayload("{\"playerId\":\"" + point.playerId() + "\"}")
                        .rejectionReason("UNKNOWN_PLAYER")
                        .build());
            } else {
                accepted.add(point);
            }
        }

        DataCleansingService.CleansingResult result = dataCleansingService.cleanse(accepted);

        if (!result.valid().isEmpty()) {
            gpsMetricRepository.saveAllAndFlush(result.valid());
        }

        List<GpsMetricQuarantine> quarantined = new ArrayList<>(result.quarantined());
        quarantined.addAll(unknownPlayers);
        if (!quarantined.isEmpty()) {
            gpsQuarantineRepository.saveAll(quarantined);
        }

        log.info("Processed {} payloads containing {} total points. Saved {} valid, {} quarantined.",
                payloads.size(), allPoints.size(), result.valid().size(), quarantined.size());
    }
}
