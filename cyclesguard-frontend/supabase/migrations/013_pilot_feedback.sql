-- In-app pilot feedback (product UX only — no health/cycle fields)
CREATE TABLE IF NOT EXISTS public.pilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'trainer', 'club_admin', 'other')),
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 1000),
  context TEXT CHECK (context IS NULL OR char_length(context) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created
  ON public.pilot_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_user
  ON public.pilot_feedback (user_id, created_at DESC);

ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pilot_feedback_insert_own" ON public.pilot_feedback;
CREATE POLICY "pilot_feedback_insert_own" ON public.pilot_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pilot_feedback_select_own" ON public.pilot_feedback;
CREATE POLICY "pilot_feedback_select_own" ON public.pilot_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.pilot_feedback IS
  'Soft-pilot product feedback. No Art.9 / cycle fields. Club admins read via service-role API only.';
