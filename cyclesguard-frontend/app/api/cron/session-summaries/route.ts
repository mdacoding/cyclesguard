import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface IngestionSessionAggregate {
  playerId: string;
  sessionId: string;
  startedAt: string;
  durationMinutes: number;
  distanceKm: number;
  avgHeartRate: number | null;
  maxSpeedKmh: number | null;
  loadScore: number;
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.INGESTION_BASE_URL;
  const managementKey = process.env.INGESTION_MANAGEMENT_KEY;
  if (!baseUrl || !managementKey) {
    return NextResponse.json({ ok: true, synced: 0, skipped: 'ingestion not configured' });
  }

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const response = await fetch(
    `${baseUrl}/api/v1/internal/session-aggregates?since=${encodeURIComponent(since)}`,
    { headers: { 'X-Management-Key': managementKey } }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch aggregates' }, { status: 502 });
  }

  const aggregates = (await response.json()) as IngestionSessionAggregate[];
  const admin = createAdminClient();
  let synced = 0;

  for (const row of aggregates) {
    const { error } = await admin.from('session_summaries').upsert(
      {
        user_id: row.playerId,
        session_id: row.sessionId,
        started_at: row.startedAt,
        duration_minutes: row.durationMinutes,
        distance_km: row.distanceKm,
        avg_heart_rate: row.avgHeartRate,
        max_speed_kmh: row.maxSpeedKmh,
        load_score: row.loadScore,
      },
      { onConflict: 'user_id,session_id' }
    );
    if (!error) synced += 1;
  }

  console.info(JSON.stringify({ event: 'session_summaries_sync', synced }));
  return NextResponse.json({ ok: true, synced });
}
