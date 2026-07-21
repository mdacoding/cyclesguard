-- CyclesGuard — combined migrations 001–008
-- Run once on a fresh Supabase project (SQL Editor → New query → Run)
-- Generated: 2026-07-21T05:13:56.861Z

-- =============================================================================
-- 001_cycle_logs.sql
-- =============================================================================

-- UUIDs via built-in gen_random_uuid() (Postgres 13+; works on Supabase Cloud
-- where uuid-ossp lives in schema "extensions" and is not on search_path)

-- Cycle Logs table
CREATE TABLE public.cycle_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    phase TEXT NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulation', 'luteal')),
    symptoms JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient per-user queries
CREATE INDEX idx_cycle_logs_user_date ON public.cycle_logs(user_id, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- Policy: players can only see their own data
CREATE POLICY "player_own_data_select" ON public.cycle_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "player_own_data_insert" ON public.cycle_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_own_data_update" ON public.cycle_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_own_data_delete" ON public.cycle_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create trainer role (if not exists) and EXPLICITLY DENY access
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trainer') THEN
    CREATE ROLE trainer;
  END IF;
END $$;

-- Revoke ALL access for trainer role at table level
REVOKE ALL ON public.cycle_logs FROM trainer;

-- Explicit DENY policy for trainer role
CREATE POLICY "trainer_deny_all" ON public.cycle_logs
    AS RESTRICTIVE
    FOR ALL
    TO trainer
    USING (false)
    WITH CHECK (false);

-- Comments for documentation
COMMENT ON TABLE public.cycle_logs IS 'Private menstrual cycle logs. Access restricted to the owning player only. Trainers have zero access.';
COMMENT ON POLICY "trainer_deny_all" ON public.cycle_logs IS 'GDPR compliance: trainers are explicitly and irrevocably denied access to cycle data.';

-- =============================================================================
-- 002_user_consents.sql
-- =============================================================================

-- User Consents Table for GDPR Audit (Art. 9)
CREATE TABLE public.player_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    health_data_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address_hashed TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_consents_user ON public.player_consents(user_id);

ALTER TABLE public.player_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_own_consents_select" ON public.player_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "player_own_consents_insert" ON public.player_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trainers have no access
CREATE POLICY "trainer_deny_consents" ON public.player_consents
    AS RESTRICTIVE FOR ALL TO trainer USING (false) WITH CHECK (false);

COMMENT ON TABLE public.player_consents IS 'Audit log for GDPR Art. 9 consent.';

-- =============================================================================
-- 003_push_subscriptions.sql
-- =============================================================================

-- Push subscription endpoints for Web Push (VAPID) — player-only, GDPR-compliant
CREATE TABLE public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_own_push_select" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "player_own_push_insert" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_own_push_update" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_own_push_delete" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "trainer_deny_push" ON public.push_subscriptions
    AS RESTRICTIVE FOR ALL TO trainer USING (false) WITH CHECK (false);

COMMENT ON TABLE public.push_subscriptions IS 'VAPID push endpoints for daily player reminders. Trainers have zero access.';

-- =============================================================================
-- 004_teams.sql
-- =============================================================================

-- Sprint 4: Team tenancy — trainers only see their roster (never raw cycle data)
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    club_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('player', 'trainer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Members can see teams they belong to
CREATE POLICY "members_select_own_teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
        )
    );

-- Members can see roster of their teams (metadata only — no cycle join)
CREATE POLICY "members_select_team_roster" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members me
            WHERE me.team_id = team_members.team_id AND me.user_id = auth.uid()
        )
    );

-- Trainers can insert player memberships into their teams
CREATE POLICY "trainer_insert_player_membership" ON public.team_members
    FOR INSERT WITH CHECK (
        role = 'player'
        AND EXISTS (
            SELECT 1 FROM public.team_members me
            WHERE me.team_id = team_members.team_id
              AND me.user_id = auth.uid()
              AND me.role = 'trainer'
        )
    );

COMMENT ON TABLE public.teams IS 'Club teams for roster scoping. Cycle data never joins here for trainers.';
COMMENT ON TABLE public.team_members IS 'Team roster. Trainers see membership only; cycle_logs remain RLS-denied.';

-- =============================================================================
-- 005_cycle_log_idempotency.sql
-- =============================================================================

-- Sprint 5: Offline sync idempotency + one log per calendar day (Europe/Berlin)
ALTER TABLE public.cycle_logs
    ADD COLUMN IF NOT EXISTS client_log_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cycle_logs_client_log_id
    ON public.cycle_logs(client_log_id)
    WHERE client_log_id IS NOT NULL;

-- One authoritative log per player per Berlin calendar day
CREATE UNIQUE INDEX IF NOT EXISTS idx_cycle_logs_user_day_berlin
    ON public.cycle_logs (
        user_id,
        ((logged_at AT TIME ZONE 'Europe/Berlin')::date)
    );

COMMENT ON COLUMN public.cycle_logs.client_log_id IS 'Client-generated UUID for offline outbox idempotency.';

-- =============================================================================
-- 006_athlete_links.sql
-- =============================================================================

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

-- =============================================================================
-- 007_session_summaries.sql
-- =============================================================================

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

-- =============================================================================
-- 008_clubs_admin.sql
-- =============================================================================

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

-- =============================================================================
-- 009_player_consents_unique.sql
-- =============================================================================

-- One consent audit row per player (seed + onboarding idempotent)
DELETE FROM public.player_consents a
USING public.player_consents b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_consents_user_unique
    ON public.player_consents(user_id);

COMMENT ON INDEX public.idx_player_consents_user_unique IS
  'At most one consent row per user; re-consent updates the same row.';
