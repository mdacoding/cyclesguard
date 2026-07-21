import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function deleteIngestionPlayerData(playerId: string): Promise<{ ok: boolean; detail?: string }> {
  const baseUrl = process.env.INGESTION_BASE_URL;
  const managementKey = process.env.INGESTION_MANAGEMENT_KEY;

  if (!baseUrl || !managementKey) {
    return { ok: false, detail: 'Ingestion cleanup not configured' };
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/internal/players/${playerId}`, {
      method: 'DELETE',
      headers: { 'X-Management-Key': managementKey },
    });
    if (!response.ok) {
      return { ok: false, detail: `Ingestion responded ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'network error' };
  }
}

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ingestion = await deleteIngestionPlayerData(user.id);
  if (!ingestion.ok) {
    console.error('Ingestion GPS cleanup failed:', ingestion.detail);
    // Continue with auth delete — do not leave Supabase identity if GPS cleanup fails in staging without ingestion
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    gpsCleanup: ingestion.ok,
    gpsCleanupDetail: ingestion.detail ?? null,
  });
}
