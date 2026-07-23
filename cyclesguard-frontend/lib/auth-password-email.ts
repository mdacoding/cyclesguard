import { createClient } from '@supabase/supabase-js';

/** Public Auth API — sends Supabase recovery/setup mail (free tier). */
export async function sendPasswordSetupEmail(
  email: string,
  nextPath = '/auth/set-password'
): Promise<{ ok: boolean; error?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, error: 'Supabase public env missing' };
  }

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function inviteCallbackRedirect(role: 'player' | 'trainer'): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  // Always land on set-password after invite/recovery; page routes onward.
  const next =
    role === 'trainer'
      ? '/auth/set-password?to=/trainer/onboarding'
      : '/auth/set-password?to=/player/onboarding';
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
