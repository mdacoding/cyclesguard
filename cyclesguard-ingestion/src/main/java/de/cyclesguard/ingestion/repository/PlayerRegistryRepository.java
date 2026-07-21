package de.cyclesguard.ingestion.repository;

import de.cyclesguard.ingestion.entity.PlayerRegistry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlayerRegistryRepository extends JpaRepository<PlayerRegistry, UUID> {
    boolean existsByPlayerId(UUID playerId);
    long count();
}
