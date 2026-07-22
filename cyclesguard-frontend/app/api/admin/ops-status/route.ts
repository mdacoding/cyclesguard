import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isClubAdmin } from '@/lib/supabase/admin';

/**
 * L2/L3 ops readiness — booleans only, no secret values.
 * Helps admins close GO-LIVE without guessing Vercel env.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const vapidPublic = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const vapidPrivate = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
  const cronSecret = Boolean(process.env.CRON_SECRET?.trim());
  const sentry = Boolean(
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  );
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
  const ingestionConfigured = Boolean(
    process.env.INGESTION_BASE_URL?.trim() && process.env.INGESTION_MANAGEMENT_KEY?.trim()
  );

  return NextResponse.json({
    push: {
      vapidPublicConfigured: vapidPublic,
      vapidPrivateConfigured: vapidPrivate,
      ready: vapidPublic && vapidPrivate && cronSecret,
    },
    cronSecretConfigured: cronSecret,
    sentryConfigured: sentry,
    demoMode,
    siteUrl,
    ingestionConfigured,
    checklist: {
      softPilotReady: vapidPublic && vapidPrivate && cronSecret && !demoMode,
      observabilityReady: sentry,
      paidPathDocs: true,
    },
  });
}
