-- Season commercial fields (manual paid path, no Stripe) + club billing contacts
ALTER TABLE public.clubs
    ADD COLUMN IF NOT EXISTS legal_name TEXT,
    ADD COLUMN IF NOT EXISTS billing_email TEXT,
    ADD COLUMN IF NOT EXISTS max_teams INTEGER,
    ADD COLUMN IF NOT EXISTS max_players INTEGER;

ALTER TABLE public.seasons
    ADD COLUMN IF NOT EXISTS commercial_status TEXT NOT NULL DEFAULT 'pilot_free'
        CHECK (commercial_status IN (
            'pilot_free',
            'quoted',
            'signed',
            'active_paid',
            'ended',
            'churned'
        )),
    ADD COLUMN IF NOT EXISTS fee_cents INTEGER,
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS contract_ref TEXT,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS signed_by_email TEXT,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT;

COMMENT ON COLUMN public.seasons.commercial_status IS 'Manual commercial lifecycle — no payment processor required';
COMMENT ON COLUMN public.seasons.internal_notes IS 'Ops-only notes; never health data';
COMMENT ON COLUMN public.clubs.billing_email IS 'Club billing contact; no player PII beyond org contact';
