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
