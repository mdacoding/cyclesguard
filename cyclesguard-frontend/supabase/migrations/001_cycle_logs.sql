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
