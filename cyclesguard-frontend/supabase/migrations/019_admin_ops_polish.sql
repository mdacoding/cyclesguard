-- Phase-B Admin Ops polish: season closing fields, roster jersey/position,
-- and a service-role-only RLS status RPC for the production readiness script.

ALTER TABLE public.seasons
    ADD COLUMN IF NOT EXISTS pilot_end_date DATE,
    ADD COLUMN IF NOT EXISTS signed_by_name TEXT;

COMMENT ON COLUMN public.seasons.pilot_end_date IS 'Planned Soft-Pilot end date — drives the "Pilot endet in Xd" nudge; manual, no billing automation.';
COMMENT ON COLUMN public.seasons.signed_by_name IS 'Contact person name for the manual contract; signed_by_email stays the audit-relevant identity.';

ALTER TABLE public.team_members
    ADD COLUMN IF NOT EXISTS jersey_number SMALLINT CHECK (jersey_number IS NULL OR (jersey_number >= 0 AND jersey_number <= 199)),
    ADD COLUMN IF NOT EXISTS position TEXT CHECK (position IS NULL OR char_length(position) <= 40);

COMMENT ON COLUMN public.team_members.jersey_number IS 'Optional roster metadata from CSV import — never health data.';
COMMENT ON COLUMN public.team_members.position IS 'Optional roster metadata from CSV import — never health data.';

-- Read-only metadata RPC for scripts/verify-readiness.ts: table name + RLS flag + policy
-- count. No row data is ever touched here, so this is safe to expose to service_role only.
CREATE OR REPLACE FUNCTION public.admin_rls_status()
RETURNS TABLE (table_name text, rls_enabled boolean, policy_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.relname::text AS table_name,
        c.relrowsecurity AS rls_enabled,
        COALESCE((SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid), 0) AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
$$;

REVOKE ALL ON FUNCTION public.admin_rls_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_rls_status() TO service_role;

COMMENT ON FUNCTION public.admin_rls_status() IS 'Service-role-only: exposes RLS enabled + policy count per public table for the production readiness script. No row data.';
