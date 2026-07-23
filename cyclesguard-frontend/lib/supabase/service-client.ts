import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Opaque sb_publishable / sb_secret keys must not be sent as Authorization Bearer —
 * Auth Admin parses Bearer as JWT and returns bad_jwt. Legacy eyJ… JWTs stay as-is.
 */
export function createServiceRoleClient(
  url: string,
  serviceKey: string
): SupabaseClient {
  const key = serviceKey.trim().replace(/^["']|["']$/g, '');
  const isOpaqueKey = key.startsWith('sb_');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: isOpaqueKey
      ? {
          fetch: (input, init) => {
            // Rebuild headers without Authorization — delete alone can miss casing / merges.
            const headers = new Headers();
            const incoming = new Headers(init?.headers);
            incoming.forEach((value, name) => {
              if (name.toLowerCase() === 'authorization') return;
              headers.set(name, value);
            });
            headers.set('apikey', key);
            return fetch(input, { ...init, headers });
          },
        }
      : undefined,
  });
}
