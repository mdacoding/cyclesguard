import { isTrainer as roleIsTrainer, isClubAdmin as roleIsClubAdmin } from '@/lib/roles';
import { createServiceRoleClient } from '@/lib/supabase/service-client';

/**
 * Admin client bypassing RLS — only for server-side aggregation routes
 * that enforce their own authorization and data masking.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;
  return createServiceRoleClient(url, key);
}

export function isTrainer(user: { app_metadata?: Record<string, unknown> }): boolean {
  return roleIsTrainer(user);
}

export function isClubAdmin(user: { app_metadata?: Record<string, unknown> }): boolean {
  return roleIsClubAdmin(user);
}
