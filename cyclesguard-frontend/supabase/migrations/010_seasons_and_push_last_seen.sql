-- Club Product: seasons + push retention activity proxy
CREATE TABLE public.seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT seasons_date_range CHECK (ends_on >= starts_on)
);

CREATE INDEX idx_seasons_club_status ON public.seasons(club_id, status);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_admin_select_seasons" ON public.seasons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = seasons.club_id
              AND cm.user_id = auth.uid()
              AND cm.role = 'club_admin'
        )
    );

-- Mutations go through service-role admin APIs
CREATE POLICY "no_client_season_write" ON public.seasons
    FOR INSERT WITH CHECK (false);

CREATE POLICY "no_client_season_update" ON public.seasons
    FOR UPDATE USING (false);

CREATE POLICY "no_client_season_delete" ON public.seasons
    FOR DELETE USING (false);

COMMENT ON TABLE public.seasons IS 'Club season windows for roster/ops. No health data.';

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS skip_weekends BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_seen
    ON public.push_subscriptions(last_seen_at);
