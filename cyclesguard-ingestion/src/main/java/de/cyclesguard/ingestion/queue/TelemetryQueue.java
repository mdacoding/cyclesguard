package de.cyclesguard.ingestion.queue;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import de.cyclesguard.ingestion.config.QueueProperties;
import de.cyclesguard.ingestion.dto.TelemetryPayload;
import de.cyclesguard.ingestion.entity.TelemetryOutbox;
import de.cyclesguard.ingestion.repository.TelemetryOutboxRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Durable Postgres outbox queue (Sprint 10) — survives process restarts.
 */
@Slf4j
@Component
public class TelemetryQueue {

    private final TelemetryOutboxRepository outboxRepository;
    private final ObjectMapper mapper;
    private final int capacity;

    public TelemetryQueue(QueueProperties queueProperties, TelemetryOutboxRepository outboxRepository) {
        this.capacity = queueProperties.capacity();
        this.outboxRepository = outboxRepository;
        this.mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Transactional
    public boolean offer(TelemetryPayload payload) {
        if (outboxRepository.count() >= capacity) {
            return false;
        }
        try {
            String json = mapper.writeValueAsString(payload);
            outboxRepository.save(TelemetryOutbox.builder().payload(json).build());
            return true;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize telemetry payload", e);
            return false;
        }
    }

    @Transactional
    public List<TelemetryPayload> drain(int maxBatchSize) {
        List<TelemetryOutbox> rows = outboxRepository.findAllByOrderByIdAsc(PageRequest.of(0, maxBatchSize));
        List<TelemetryPayload> payloads = new ArrayList<>(rows.size());

        for (TelemetryOutbox row : rows) {
            try {
                payloads.add(mapper.readValue(row.getPayload(), TelemetryPayload.class));
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize outbox payload id={}", row.getId(), e);
            }
        }

        if (!rows.isEmpty()) {
            outboxRepository.deleteAllInBatch(rows);
        }
        return payloads;
    }

    public int size() {
        return (int) Math.min(Integer.MAX_VALUE, outboxRepository.count());
    }
}
