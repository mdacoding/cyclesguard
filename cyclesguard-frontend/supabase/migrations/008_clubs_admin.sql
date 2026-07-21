-- Sprint 12: Clubs, club admins, audit log
CREATE TABLE public.clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teams
    ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE TABLE public.club_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('club_admin', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, user_id)
);

CREATE TABLE public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_admin_audit_actor ON public.admin_audit_log(actor_id, created_at DESC);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_admin_select_clubs" ON public.clubs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = clubs.id
              AND cm.user_id = auth.uid()
              AND cm.role = 'club_admin'
        )
    );

CREATE POLICY "club_admin_select_members" ON public.club_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.club_members me
            WHERE me.club_id = club_members.club_id
              AND me.user_id = auth.uid()
              AND me.role = 'club_admin'
        )
    );

-- Audit readable only by platform via service role; no broad client policy
CREATE POLICY "no_client_audit_select" ON public.admin_audit_log
    FOR SELECT USING (false);

COMMENT ON TABLE public.clubs IS 'Club org unit. Club admins see roster metadata and adherence only — never cycle raw data.';
