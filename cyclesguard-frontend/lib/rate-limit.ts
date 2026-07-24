import type { SupabaseClient } from '@supabase/supabase-js';

/** Simple in-memory sliding window — best-effort fallback on serverless. */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Durable rate limit via Postgres RPC (migration 018). Falls back to in-memory
 * if the admin client / RPC is unavailable — Soft-Pilot stays available.
 */
export async function checkRateLimitDurable(
  admin: SupabaseClient | null | undefined,
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSec: number; source: 'db' | 'memory' }> {
  if (!admin) {
    return { ...checkRateLimit(key, limit, windowMs), source: 'memory' };
  }
  try {
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error) {
      console.warn('consume_rate_limit RPC failed — memory fallback:', error.message);
      return { ...checkRateLimit(key, limit, windowMs), source: 'memory' };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.ok !== 'boolean') {
      return { ...checkRateLimit(key, limit, windowMs), source: 'memory' };
    }
    return {
      ok: row.ok,
      retryAfterSec: Number(row.retry_after_sec) || 0,
      source: 'db',
    };
  } catch (err) {
    console.warn('consume_rate_limit threw — memory fallback:', err);
    return { ...checkRateLimit(key, limit, windowMs), source: 'memory' };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
