-- Sprint 5: Offline sync idempotency + one log per calendar day (Europe/Berlin)
ALTER TABLE public.cycle_logs
    ADD COLUMN IF NOT EXISTS client_log_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cycle_logs_client_log_id
    ON public.cycle_logs(client_log_id)
    WHERE client_log_id IS NOT NULL;

-- One authoritative log per player per Berlin calendar day
CREATE UNIQUE INDEX IF NOT EXISTS idx_cycle_logs_user_day_berlin
    ON public.cycle_logs (
        user_id,
        ((logged_at AT TIME ZONE 'Europe/Berlin')::date)
    );

COMMENT ON COLUMN public.cycle_logs.client_log_id IS 'Client-generated UUID for offline outbox idempotency.';
