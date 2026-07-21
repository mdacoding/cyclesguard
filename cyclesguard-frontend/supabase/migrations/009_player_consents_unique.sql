-- One consent audit row per player (seed + onboarding idempotent)
DELETE FROM public.player_consents a
USING public.player_consents b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_consents_user_unique
    ON public.player_consents(user_id);

COMMENT ON INDEX public.idx_player_consents_user_unique IS
  'At most one consent row per user; re-consent updates the same row.';
