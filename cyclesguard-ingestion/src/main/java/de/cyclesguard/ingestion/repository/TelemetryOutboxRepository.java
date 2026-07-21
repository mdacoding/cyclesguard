package de.cyclesguard.ingestion.repository;

import de.cyclesguard.ingestion.entity.TelemetryOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelemetryOutboxRepository extends JpaRepository<TelemetryOutbox, Long> {
    List<TelemetryOutbox> findAllByOrderByIdAsc(Pageable pageable);
}
