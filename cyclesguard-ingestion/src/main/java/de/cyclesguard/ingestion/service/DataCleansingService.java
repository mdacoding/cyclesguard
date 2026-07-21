package de.cyclesguard.ingestion.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import de.cyclesguard.ingestion.config.CleansingProperties;
import de.cyclesguard.ingestion.dto.GpsDataPoint;
import de.cyclesguard.ingestion.entity.GpsMetric;
import de.cyclesguard.ingestion.entity.GpsMetricQuarantine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DataCleansingService {

    private final CleansingProperties props;
    private final ObjectMapper mapper;

    public record CleansingResult(List<GpsMetric> valid, List<GpsMetricQuarantine> quarantined) {}

    public DataCleansingService(CleansingProperties props) {
        this.props = props;
        this.mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    public CleansingResult cleanse(List<GpsDataPoint> points) {
        List<GpsMetric> valid = new ArrayList<>();
        List<GpsMetricQuarantine> quarantined = new ArrayList<>();

        Map<String, List<GpsDataPoint>> groupedPoints = points.stream()
                .collect(Collectors.groupingBy(p -> p.playerId() + "_" + p.sessionId()));

        for (List<GpsDataPoint> sessionPoints : groupedPoints.values()) {
            sessionPoints.sort(Comparator.comparing(GpsDataPoint::recordedAt));
            
            Double prevLat = null;
            Double prevLon = null;
            Instant prevTime = null;
            
            for (GpsDataPoint point : sessionPoints) {
                if (point.heartRate() != null && (point.heartRate() < props.minHeartRate() || point.heartRate() > props.maxHeartRate())) {
                    quarantined.add(createQuarantine(point, "INVALID_HEART_RATE"));
                    continue;
                }

                if (prevLat != null && prevLon != null && prevTime != null) {
                    double distanceKm = haversine(prevLat, prevLon, point.latitude(), point.longitude());
                    long seconds = Duration.between(prevTime, point.recordedAt()).getSeconds();
                    
                    if (seconds > 0) {
                        double speedKmh = (distanceKm / seconds) * 3600;
                        if (speedKmh > props.maxSpeedKmh()) {
                            quarantined.add(createQuarantine(point, "IMPOSSIBLE_GPS_JUMP"));
                            continue;
                        }
                    }

                    if (seconds > props.maxTimestampGapSeconds()) {
                        long halfGap = seconds / 2;
                        GpsMetric interpolated = GpsMetric.builder()
                                .playerId(point.playerId())
                                .sessionId(point.sessionId())
                                .recordedAt(prevTime.plusSeconds(halfGap))
                                .latitude(prevLat + (point.latitude() - prevLat) / 2)
                                .longitude(prevLon + (point.longitude() - prevLon) / 2)
                                .interpolated(true)
                                .build();
                        valid.add(interpolated);
                    }
                }

                double lat = point.latitude();
                double lon = point.longitude();

                if (prevLat != null && prevLon != null) {
                    lat = props.emaAlpha() * lat + (1 - props.emaAlpha()) * prevLat;
                    lon = props.emaAlpha() * lon + (1 - props.emaAlpha()) * prevLon;
                }

                GpsMetric validMetric = GpsMetric.builder()
                        .playerId(point.playerId())
                        .sessionId(point.sessionId())
                        .recordedAt(point.recordedAt())
                        .latitude(lat)
                        .longitude(lon)
                        .heartRate(point.heartRate())
                        .speedKmh(point.speedKmh())
                        .interpolated(false)
                        .build();

                valid.add(validMetric);
                
                prevLat = lat;
                prevLon = lon;
                prevTime = point.recordedAt();
            }
        }
        
        return new CleansingResult(valid, quarantined);
    }

    private GpsMetricQuarantine createQuarantine(GpsDataPoint point, String reason) {
        String json = "{}";
        try {
            json = mapper.writeValueAsString(point);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize quarantined point", e);
        }
        return GpsMetricQuarantine.builder()
                .playerId(point.playerId())
                .sessionId(point.sessionId())
                .rawPayload(json)
                .rejectionReason(reason)
                .build();
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
