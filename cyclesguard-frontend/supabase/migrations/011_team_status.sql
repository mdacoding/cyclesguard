-- Team lifecycle: active | archived (Club Product)
ALTER TABLE public.teams
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived'));

CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);

COMMENT ON COLUMN public.teams.status IS 'active = visible in admin/trainer; archived = hidden from day-to-day lists';
