-- Durable rate-limit buckets for serverless Soft-Pilot (bulk invite / feedback).
-- Service-role only — no authenticated policies (RLS on = deny for clients).

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hit_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.api_rate_limits IS
  'Sliding-window rate limits for server routes. Accessed only via service role / SECURITY DEFINER RPC.';

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_ms BIGINT
)
RETURNS TABLE(ok BOOLEAN, retry_after_sec INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_reset TIMESTAMPTZ;
  v_count INT;
  v_window INTERVAL := make_interval(secs => GREATEST(p_window_ms, 1000)::DOUBLE PRECISION / 1000.0);
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR p_limit < 1 THEN
    RETURN QUERY SELECT FALSE, 60;
    RETURN;
  END IF;

  SELECT r.reset_at, r.hit_count
    INTO v_reset, v_count
  FROM public.api_rate_limits r
  WHERE r.bucket_key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.api_rate_limits (bucket_key, hit_count, reset_at, updated_at)
    VALUES (p_key, 1, v_now + v_window, v_now);
    RETURN QUERY SELECT TRUE, 0;
    RETURN;
  END IF;

  IF v_reset <= v_now THEN
    UPDATE public.api_rate_limits
    SET hit_count = 1,
        reset_at = v_now + v_window,
        updated_at = v_now
    WHERE bucket_key = p_key;
    RETURN QUERY SELECT TRUE, 0;
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset - v_now)))::INT);
    RETURN;
  END IF;

  UPDATE public.api_rate_limits
  SET hit_count = hit_count + 1,
      updated_at = v_now
  WHERE bucket_key = p_key;

  RETURN QUERY SELECT TRUE, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INT, BIGINT) TO service_role;
