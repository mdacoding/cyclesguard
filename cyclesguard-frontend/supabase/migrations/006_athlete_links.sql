-- Sprint 8: External wearable identity → Supabase user bridge
CREATE TABLE public.athlete_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    external_athlete_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, external_athlete_id)
);

CREATE INDEX idx_athlete_links_user ON public.athlete_links(user_id);

ALTER TABLE public.athlete_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_own_athlete_links_select" ON public.athlete_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trainer_deny_athlete_links" ON public.athlete_links
    AS RESTRICTIVE FOR ALL TO trainer USING (false) WITH CHECK (false);

COMMENT ON TABLE public.athlete_links IS 'Maps wearable provider IDs to Supabase users. Trainers have zero access.';
