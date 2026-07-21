import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin, isTrainer } from '@/lib/supabase/admin';

const LinkSchema = z.object({
  userId: z.string().uuid(),
  provider: z.string().min(1).max(64),
  externalAthleteId: z.string().min(1).max(128),
  teamId: z.string().uuid().optional(),
});

/** Registers wearable identity and syncs player_id into ingestion registry. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(user) && !isClubAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = LinkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('athlete_links').upsert(
    {
      user_id: parsed.data.userId,
      provider: parsed.data.provider,
      external_athlete_id: parsed.data.externalAthleteId,
      team_id: parsed.data.teamId ?? null,
    },
    { onConflict: 'provider,external_athlete_id' }
  );

  if (error) {
    return NextResponse.json({ error: 'Failed to save athlete link' }, { status: 500 });
  }

  const baseUrl = process.env.INGESTION_BASE_URL;
  const managementKey = process.env.INGESTION_MANAGEMENT_KEY;
  if (baseUrl && managementKey) {
    await fetch(`${baseUrl}/api/v1/internal/players/registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Management-Key': managementKey,
      },
      body: JSON.stringify({
        playerId: parsed.data.userId,
        externalAthleteId: parsed.data.externalAthleteId,
        provider: parsed.data.provider,
      }),
    }).catch((err) => console.warn('Registry sync failed', err));
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
