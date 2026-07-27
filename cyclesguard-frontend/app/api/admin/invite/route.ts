import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';
import { adminInviteOrRosterAdd } from '@/lib/admin-invite';
import { sendPasswordSetupEmail } from '@/lib/auth-password-email';

const InviteSchema = z.union([
  z.object({
    email: z.string().email(),
    teamId: z.string().uuid(),
    fullName: z.string().min(1).max(100).optional(),
    role: z.enum(['player', 'trainer']).default('player'),
    jerseyNumber: z.number().int().min(0).max(199).nullable().optional(),
    position: z.string().max(40).nullable().optional(),
  }),
  z.object({
    teamId: z.string().uuid(),
    userId: z.string().uuid(),
    resend: z.literal(true),
  }),
]);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = InviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  const admin = createAdminClient();
  const scoped = await assertClubScope(
    admin,
    user.id,
    parsed.data.teamId,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });

  if ('resend' in parsed.data) {
    const { teamId, userId } = parsed.data;
    const { data: membership } = await admin
      .from('team_members')
      .select('id, role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Mitglied nicht in diesem Team.' }, { status: 404 });
    }

    const { data: target, error: userError } = await admin.auth.admin.getUserById(userId);
    if (userError || !target.user?.email) {
      return NextResponse.json({ error: 'Nutzerin nicht gefunden.' }, { status: 404 });
    }

    const mail = await sendPasswordSetupEmail(target.user.email);
    if (!mail.ok) {
      return NextResponse.json(
        { error: mail.error ?? 'Setup-Mail konnte nicht gesendet werden.' },
        { status: 500 }
      );
    }

    await admin.from('admin_audit_log').insert({
      actor_id: user.id,
      action: 'invite_resend',
      target_user_id: userId,
      metadata: { team_id: teamId, email: target.user.email, role: membership.role },
    });

    return NextResponse.json({
      success: true,
      mode: 'invite_resend',
      message: 'Passwort-/Einladungs-Mail erneut gesendet.',
    });
  }

  const result = await adminInviteOrRosterAdd(admin, {
    email: parsed.data.email,
    teamId: parsed.data.teamId,
    fullName: parsed.data.fullName,
    role: parsed.data.role,
    actorId: user.id,
    jerseyNumber: parsed.data.jerseyNumber,
    position: parsed.data.position,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      success: true,
      userId: result.userId,
      mode: result.mode,
      message: result.message,
    },
    { status: result.status }
  );
}
