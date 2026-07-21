package de.cyclesguard.ingestion.repository;

import de.cyclesguard.ingestion.entity.GpsMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface GpsMetricRepository extends JpaRepository<GpsMetric, Long> {
    <S extends GpsMetric> List<S> saveAllAndFlush(Iterable<S> entities);

    void deleteByPlayerId(UUID playerId);

    @Query("""
            SELECT m FROM GpsMetric m
            WHERE m.recordedAt >= :since
            ORDER BY m.playerId, m.sessionId, m.recordedAt
            """)
    List<GpsMetric> findSince(@Param("since") Instant since);
}
