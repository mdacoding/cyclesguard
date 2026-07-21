-- Sprint 8/10: durable telemetry outbox + known player registry
CREATE TABLE telemetry_outbox (
    id BIGSERIAL PRIMARY KEY,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_registry (
    player_id UUID PRIMARY KEY,
    external_athlete_id TEXT,
    provider TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_outbox_created ON telemetry_outbox(created_at);
