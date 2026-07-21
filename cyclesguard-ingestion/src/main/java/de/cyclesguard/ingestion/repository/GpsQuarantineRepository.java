package de.cyclesguard.ingestion.repository;

import de.cyclesguard.ingestion.entity.GpsMetricQuarantine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GpsQuarantineRepository extends JpaRepository<GpsMetricQuarantine, Long> {
    void deleteByPlayerId(UUID playerId);
}
