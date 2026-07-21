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
@Table(name = "gps_metrics_quarantine")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsMetricQuarantine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "raw_payload", columnDefinition = "JSONB", nullable = false)
    private String rawPayload;

    @Column(name = "rejection_reason", nullable = false)
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;
}
