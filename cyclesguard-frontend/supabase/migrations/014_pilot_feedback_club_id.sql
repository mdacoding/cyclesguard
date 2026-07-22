-- Scope pilot feedback to clubs for multi-club admin reads
ALTER TABLE public.pilot_feedback
  ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_club_created
  ON public.pilot_feedback (club_id, created_at DESC);

COMMENT ON COLUMN public.pilot_feedback.club_id IS
  'Resolved at insert from team/club membership; used to scope admin reads.';
