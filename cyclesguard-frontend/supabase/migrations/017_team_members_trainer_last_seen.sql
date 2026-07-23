-- Coach-safe Kabine activity: when trainer opens team-status, touch last_seen_at.
-- Used for Soft-Pilot KPI „Trainer öffnet Dashboard ≥3× / Woche“ (counts only, no health data).

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_members_role_last_seen
  ON public.team_members (role, last_seen_at)
  WHERE role = 'trainer';

COMMENT ON COLUMN public.team_members.last_seen_at IS
  'Last authenticated Kabine/team-status touch for trainers (privacy-safe activity only).';
