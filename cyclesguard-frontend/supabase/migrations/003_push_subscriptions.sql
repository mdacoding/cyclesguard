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
