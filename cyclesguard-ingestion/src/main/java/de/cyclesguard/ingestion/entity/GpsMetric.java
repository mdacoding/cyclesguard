package de.cyclesguard.ingestion.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gps_metrics", indexes = {
        @Index(name = "idx_gps_metrics_player_session", columnList = "player_id, session_id, recorded_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Column(nullable = false)
    @Builder.Default
    private Boolean interpolated = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
