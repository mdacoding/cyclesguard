-- Expected empty / denied results when run as trainer JWT (not service_role).
-- Use in Supabase SQL editor after setting request.jwt claims OR via PostgREST with trainer token.
-- Documented in RLS-PENETRATION-CHECKLIST.md

-- 1) cycle_logs: must return 0 rows for trainer
-- select count(*) as cycle_logs_visible from public.cycle_logs;

-- 2) player_consents: must return 0 rows
-- select count(*) as consents_visible from public.player_consents;

-- 3) push_subscriptions: must return 0 rows
-- select count(*) as push_visible from public.push_subscriptions;

-- 4) session_summaries: must return 0 rows for trainer role client
-- select count(*) as summaries_visible from public.session_summaries;

-- Positive control: team_members of own teams may be visible
-- select count(*) as roster_visible from public.team_members;

select
  'Use checklist section B with trainer session — service_role will always see rows' as note;
