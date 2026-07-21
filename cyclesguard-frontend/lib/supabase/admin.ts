import { createClient } from '@supabase/supabase-js';
import { isTrainer as roleIsTrainer, isClubAdmin as roleIsClubAdmin } from '@/lib/roles';

/**
 * Admin client bypassing RLS — only for server-side aggregation routes
 * that enforce their own authorization and data masking.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function isTrainer(user: { app_metadata?: Record<string, unknown> }): boolean {
  return roleIsTrainer(user);
}

export function isClubAdmin(user: { app_metadata?: Record<string, unknown> }): boolean {
  return roleIsClubAdmin(user);
}
