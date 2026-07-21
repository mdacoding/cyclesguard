package de.cyclesguard.ingestion.service;

import de.cyclesguard.ingestion.config.CleansingProperties;
import de.cyclesguard.ingestion.dto.GpsDataPoint;
import de.cyclesguard.ingestion.entity.GpsMetric;
import de.cyclesguard.ingestion.entity.GpsMetricQuarantine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DataCleansingServiceTest {

    private DataCleansingService service;
    private final UUID playerId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CleansingProperties props = new CleansingProperties(0.3, 220, 30, 40.0, 5);
        service = new DataCleansingService(props);
    }

    @Test
    void testValidPointPassesCleansing() {
        GpsDataPoint pt1 = new GpsDataPoint(playerId, sessionId, Instant.now(), 50.0, 10.0, 75, 12.0);
        
        DataCleansingService.CleansingResult res = service.cleanse(List.of(pt1));
        assertEquals(1, res.valid().size());
        assertEquals(0, res.quarantined().size());
        assertEquals(50.0, res.valid().get(0).getLatitude());
    }

    @Test
    void testLowHeartRateGoesToQuarantine() {
        GpsDataPoint pt1 = new GpsDataPoint(playerId, sessionId, Instant.now(), 50.0, 10.0, 25, 12.0);
        
        DataCleansingService.CleansingResult res = service.cleanse(List.of(pt1));
        assertEquals(0, res.valid().size());
        assertEquals(1, res.quarantined().size());
        assertEquals("INVALID_HEART_RATE", res.quarantined().get(0).getRejectionReason());
    }

    @Test
    void testHighHeartRateGoesToQuarantine() {
        GpsDataPoint pt1 = new GpsDataPoint(playerId, sessionId, Instant.now(), 50.0, 10.0, 230, 12.0);
        
        DataCleansingService.CleansingResult res = service.cleanse(List.of(pt1));
        assertEquals(0, res.valid().size());
        assertEquals(1, res.quarantined().size());
        assertEquals("INVALID_HEART_RATE", res.quarantined().get(0).getRejectionReason());
    }

    @Test
    void testImpossibleGpsJumpGoesToQuarantine() {
        Instant now = Instant.now();
        GpsDataPoint pt1 = new GpsDataPoint(playerId, sessionId, now, 50.0, 10.0, 75, 12.0);
        GpsDataPoint pt2 = new GpsDataPoint(playerId, sessionId, now.plusSeconds(1), 51.0, 11.0, 75, 12.0); // ~100km+ away in 1 sec
        
        DataCleansingService.CleansingResult res = service.cleanse(List.of(pt1, pt2));
        assertEquals(1, res.valid().size()); // First point is valid
        assertEquals(1, res.quarantined().size()); // Second point fails jump check
        assertEquals("IMPOSSIBLE_GPS_JUMP", res.quarantined().get(0).getRejectionReason());
    }

    @Test
    void testEmaSmoothing() {
        Instant now = Instant.now();
        GpsDataPoint pt1 = new GpsDataPoint(playerId, sessionId, now, 50.0, 10.0, 75, 12.0);
        GpsDataPoint pt2 = new GpsDataPoint(playerId, sessionId, now.plusSeconds(1), 51.0, 11.0, 75, 12.0); // Wait, this is impossible jump. Make it smaller.
        
        // ~1.1m in 1s ≈ 4 km/h — well under maxSpeedKmh=40
        GpsDataPoint validPt2 = new GpsDataPoint(playerId, sessionId, now.plusSeconds(1), 50.00001, 10.00001, 75, 12.0);

        DataCleansingService.CleansingResult res = service.cleanse(List.of(pt1, validPt2));
        assertEquals(2, res.valid().size());

        GpsMetric res1 = res.valid().get(0);
        GpsMetric res2 = res.valid().get(1);

        assertEquals(50.0, res1.getLatitude());
        // EMA: 0.3 * 50.00001 + 0.7 * 50.0 = 50.000003
        assertTrue(Math.abs(res2.getLatitude() - 50.000003) < 0.000001);
    }
}
