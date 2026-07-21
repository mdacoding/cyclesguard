package de.cyclesguard.ingestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_registry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerRegistry {

    @Id
    @Column(name = "player_id")
    private UUID playerId;

    @Column(name = "external_athlete_id")
    private String externalAthleteId;

    private String provider;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
