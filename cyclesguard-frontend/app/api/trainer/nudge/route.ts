import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';
import { getTrainerTeamIds, getTeamPlayerIds } from '@/lib/teams';
import { sendTrainerNudges } from '@/lib/push/send';
import { checkRateLimitDurable } from '@/lib/rate-limit';

const NudgeSchema = z.object({
  teamId: z.string().uuid().optional(),
  /** Empty / omit = all missing-today players in scope */
  playerIds: z.array(z.string().uuid()).max(40).optional(),
});

/**
 * Coach-safe push nudge: "please log readiness today".
 * Never includes phase/symptoms/names in the OS notification payload.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = NudgeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const limit = await checkRateLimitDurable(admin, `trainer-nudge:${user.id}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Zu viele Erinnerungen. Bitte später erneut versuchen.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const trainerTeamIds = await getTrainerTeamIds(user.id);
  if (trainerTeamIds.length === 0) {
    return NextResponse.json({ error: 'Kein Team zugewiesen' }, { status: 403 });
  }

  const { teamId, playerIds: requestedIds } = parsed.data;
  if (teamId && !trainerTeamIds.includes(teamId)) {
    return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });
  }

  const scopeTeamIds = teamId ? [teamId] : trainerTeamIds;
  const scopedPlayerIds = await getTeamPlayerIds(scopeTeamIds);
  const scopedSet = new Set(scopedPlayerIds);

  let targets: string[];
  if (requestedIds && requestedIds.length > 0) {
    targets = requestedIds.filter((id) => scopedSet.has(id));
    if (targets.length === 0) {
      return NextResponse.json({ error: 'Keine Spielerinnen in deinem Scope' }, { status: 403 });
    }
  } else {
    targets = scopedPlayerIds;
  }

  try {
    const stats = await sendTrainerNudges(targets);
    await admin.from('admin_audit_log').insert({
      actor_id: user.id,
      action: 'trainer_nudge',
      metadata: {
        team_id: teamId ?? null,
        targets: targets.length,
        sent: stats.sent,
        skipped_logged: stats.skippedAlreadyLogged,
        skipped_no_sub: stats.skippedNoSub,
      },
    });
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Push failed';
    if (/VAPID/i.test(message)) {
      return NextResponse.json({ error: 'Push ist nicht konfiguriert' }, { status: 503 });
    }
    console.error('trainer nudge failed', err);
    return NextResponse.json({ error: 'Erinnerung fehlgeschlagen' }, { status: 500 });
  }
}
