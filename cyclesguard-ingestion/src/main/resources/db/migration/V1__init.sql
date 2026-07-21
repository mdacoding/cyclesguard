CREATE TABLE gps_metrics (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL,
    session_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heart_rate INTEGER,
    speed_kmh DOUBLE PRECISION,
    interpolated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gps_metrics_player_session ON gps_metrics(player_id, session_id, recorded_at);

CREATE TABLE gps_metrics_quarantine (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL,
    session_id UUID NOT NULL,
    raw_payload JSONB NOT NULL,
    rejection_reason VARCHAR(255) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
