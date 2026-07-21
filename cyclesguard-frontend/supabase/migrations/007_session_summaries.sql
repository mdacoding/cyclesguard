-- Sprint 8/11: Aggregated GPS session summaries (no raw coordinates)
CREATE TABLE public.session_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    distance_km DOUBLE PRECISION,
    avg_heart_rate INTEGER,
    max_speed_kmh DOUBLE PRECISION,
    load_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, session_id)
);

CREATE INDEX idx_session_summaries_user_started
    ON public.session_summaries(user_id, started_at DESC);

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_own_summaries_select" ON public.session_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trainer_deny_summaries" ON public.session_summaries
    AS RESTRICTIVE FOR ALL TO trainer USING (false) WITH CHECK (false);

COMMENT ON TABLE public.session_summaries IS 'Coach-safe aggregates only. No lat/lon. Trainers access only via masked API.';
