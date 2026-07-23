/**
 * Seeds a pitch/demo club on Supabase (Cloud or local).
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Env (optional, club-agnostic defaults):
 *   DEMO_TEAM_NAME   default "CyclesGuard Demo Frauen"
 *   DEMO_CLUB_NAME   default "CyclesGuard Demo"
 *   DEMO_SEASON_NAME default "Saison 26/27 (Demo)"
 *
 * Emails stay on @eintracht-demo.de for stable DemoLoginHint / existing Auth users.
 * Legacy team/club names ("Eintracht…") are renamed on re-seed.
 *
 * Usage: npm run seed:demo   (alias: npm run seed:eintracht)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_PASSWORD = 'CyclesGuard2026!';
const TEAM_NAME = process.env.DEMO_TEAM_NAME?.trim() || 'CyclesGuard Demo Frauen';
const CLUB_NAME = process.env.DEMO_CLUB_NAME?.trim() || 'CyclesGuard Demo';
const SEASON_NAME = process.env.DEMO_SEASON_NAME?.trim() || 'Saison 26/27 (Demo)';
const LEGACY_TEAM_NAME = 'Eintracht Frankfurt Frauen';
const LEGACY_CLUB_NAME = 'Eintracht Frankfurt';
const TEAM_SLUG = 'demo-frauen';

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
type AppRole = 'player' | 'trainer' | 'club_admin' | 'platform_admin';

interface DemoPlayer {
  email: string;
  fullName: string;
  phase?: CyclePhase;
  energyLevel?: number | null;
  symptoms?: string[];
  /** Hours ago for logged_at; omit = no log (NO_DATA) */
  logHoursAgo?: number;
  /** Optional GPS session summary for trainer load + player card */
  session?: {
    hoursAgo: number;
    durationMinutes: number;
    distanceKm: number;
    avgHeartRate: number;
    loadScore: number;
  };
}

const DEMO_TRAINER = {
  email: 'trainer@eintracht-demo.de',
  fullName: 'Lisa Athletik (Demo)',
};

const DEMO_CLUB_ADMIN = {
  email: 'admin@eintracht-demo.de',
  fullName: 'Club Admin (Demo)',
};

const DEMO_PLAYERS: DemoPlayer[] = [
  {
    email: 'anna.mueller@eintracht-demo.de',
    fullName: 'Anna Müller',
    phase: 'follicular',
    energyLevel: 5,
    logHoursAgo: 2,
    session: {
      hoursAgo: 5,
      durationMinutes: 78,
      distanceKm: 8.4,
      avgHeartRate: 148,
      loadScore: 320,
    },
  },
  {
    email: 'sara.klein@eintracht-demo.de',
    fullName: 'Sara Klein',
    phase: 'ovulation',
    energyLevel: 4,
    logHoursAgo: 4,
    session: {
      hoursAgo: 6,
      durationMinutes: 90,
      distanceKm: 9.1,
      avgHeartRate: 162,
      loadScore: 480,
    },
  },
  {
    email: 'lisa.weber@eintracht-demo.de',
    fullName: 'Lisa Weber',
    phase: 'menstrual',
    energyLevel: 1,
    symptoms: ['cramps', 'fatigue'],
    logHoursAgo: 1,
  },
  {
    email: 'nina.fischer@eintracht-demo.de',
    fullName: 'Nina Fischer',
    phase: 'menstrual',
    energyLevel: 4,
    logHoursAgo: 3,
  },
  {
    email: 'mia.becker@eintracht-demo.de',
    fullName: 'Mia Becker',
    phase: 'luteal',
    energyLevel: 3,
    logHoursAgo: 6,
  },
  {
    email: 'lea.hoffmann@eintracht-demo.de',
    fullName: 'Lea Hoffmann',
  },
  {
    email: 'julia.richter@eintracht-demo.de',
    fullName: 'Julia Richter',
    phase: 'follicular',
    energyLevel: 4,
    logHoursAgo: 72,
  },
];

function loadEnvLocal(): void {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function hashIp(ip: string): string {
  const salt = process.env.CONSENT_IP_SALT ?? 'cyclesguard-demo-seed';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

type AdminClient = SupabaseClient;

async function findUserByEmail(admin: AdminClient, email: string): Promise<string | null> {
  const needle = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === needle);
    if (user) return user.id;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 20) return null;
  }
}

async function upsertUser(
  admin: AdminClient,
  opts: {
    email: string;
    password: string;
    fullName: string;
    role: AppRole;
    hasConsented?: boolean;
  }
): Promise<string> {
  const existingId = await findUserByEmail(admin, opts.email);
  const userMetadata = {
    full_name: opts.fullName,
    ...(opts.hasConsented ? { has_consented: true } : {}),
  };
  const appMetadata = { role: opts.role };

  if (existingId) {
    const { data, error } = await admin.auth.admin.updateUserById(existingId, {
      password: opts.password,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: appMetadata,
    });
    if (error) throw error;
    return data.user.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  });
  if (error) throw error;
  return data.user.id;
}

async function main(): Promise<void> {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Seeding pitch demo… (${TEAM_NAME} / ${CLUB_NAME})`);

  const trainerId = await upsertUser(admin, {
    email: DEMO_TRAINER.email,
    password: DEMO_PASSWORD,
    fullName: DEMO_TRAINER.fullName,
    role: 'trainer',
  });
  console.log(`  Trainer: ${DEMO_TRAINER.email}`);

  const clubAdminId = await upsertUser(admin, {
    email: DEMO_CLUB_ADMIN.email,
    password: DEMO_PASSWORD,
    fullName: DEMO_CLUB_ADMIN.fullName,
    role: 'club_admin',
  });
  console.log(`  Club Admin: ${DEMO_CLUB_ADMIN.email}`);

  const playerIds: { id: string; spec: DemoPlayer }[] = [];
  for (const spec of DEMO_PLAYERS) {
    const id = await upsertUser(admin, {
      email: spec.email,
      password: DEMO_PASSWORD,
      fullName: spec.fullName,
      role: 'player',
      hasConsented: true,
    });
    playerIds.push({ id, spec });
    console.log(`  Player: ${spec.fullName}`);
  }

  let clubId: string;
  const { data: existingClub } = await admin
    .from('clubs')
    .select('id')
    .eq('name', CLUB_NAME)
    .maybeSingle();

  if (existingClub?.id) {
    clubId = existingClub.id;
  } else {
    const { data: legacyClub } = await admin
      .from('clubs')
      .select('id')
      .eq('name', LEGACY_CLUB_NAME)
      .maybeSingle();
    if (legacyClub?.id) {
      clubId = legacyClub.id;
      await admin.from('clubs').update({ name: CLUB_NAME }).eq('id', clubId);
      console.log(`  Renamed club ${LEGACY_CLUB_NAME} → ${CLUB_NAME}`);
    } else {
      const { data: club, error: clubError } = await admin
        .from('clubs')
        .insert({ name: CLUB_NAME })
        .select('id')
        .single();
      if (clubError) throw clubError;
      clubId = club.id;
    }
  }

  const { error: clubMemberError } = await admin.from('club_members').upsert(
    {
      club_id: clubId,
      user_id: clubAdminId,
      role: 'club_admin',
    },
    { onConflict: 'club_id,user_id' }
  );
  if (clubMemberError) throw clubMemberError;

  const { data: existingSeason } = await admin
    .from('seasons')
    .select('id')
    .eq('club_id', clubId)
    .eq('name', SEASON_NAME)
    .maybeSingle();

  if (existingSeason?.id) {
    await admin
      .from('seasons')
      .update({ status: 'active', starts_on: '2026-07-01', ends_on: '2027-06-30' })
      .eq('id', existingSeason.id);
  } else {
    await admin
      .from('seasons')
      .update({ status: 'completed' })
      .eq('club_id', clubId)
      .eq('status', 'active');
    const { error: seasonError } = await admin.from('seasons').insert({
      club_id: clubId,
      name: SEASON_NAME,
      starts_on: '2026-07-01',
      ends_on: '2027-06-30',
      status: 'active',
    });
    if (seasonError) throw seasonError;
  }
  console.log(`  Season: ${SEASON_NAME}`);

  let teamId: string;
  const { data: existingTeam } = await admin
    .from('teams')
    .select('id')
    .eq('name', TEAM_NAME)
    .maybeSingle();

  if (existingTeam?.id) {
    teamId = existingTeam.id;
    await admin
      .from('teams')
      .update({ club_id: clubId, club_name: CLUB_NAME, status: 'active' })
      .eq('id', teamId);
  } else {
    const { data: legacyTeam } = await admin
      .from('teams')
      .select('id')
      .eq('name', LEGACY_TEAM_NAME)
      .maybeSingle();
    if (legacyTeam?.id) {
      teamId = legacyTeam.id;
      await admin
        .from('teams')
        .update({
          name: TEAM_NAME,
          club_id: clubId,
          club_name: CLUB_NAME,
          status: 'active',
        })
        .eq('id', teamId);
      console.log(`  Renamed team ${LEGACY_TEAM_NAME} → ${TEAM_NAME}`);
    } else {
      const { data: team, error: teamError } = await admin
        .from('teams')
        .insert({ name: TEAM_NAME, club_name: CLUB_NAME, club_id: clubId, status: 'active' })
        .select('id')
        .single();
      if (teamError) throw teamError;
      teamId = team.id;
    }
  }

  const memberships: { team_id: string; user_id: string; role: 'player' | 'trainer' }[] = [
    { team_id: teamId, user_id: trainerId, role: 'trainer' },
    ...playerIds.map(({ id }) => ({ team_id: teamId, user_id: id, role: 'player' as const })),
  ];

  for (const row of memberships) {
    const { error } = await admin.from('team_members').upsert(row, {
      onConflict: 'team_id,user_id',
    });
    if (error) throw error;
  }

  const consentHash = hashIp('127.0.0.1');
  const now = new Date().toISOString();
  for (const { id } of playerIds) {
    const { error } = await admin.from('player_consents').upsert(
      {
        user_id: id,
        health_data_consent_at: now,
        terms_accepted_at: now,
        ip_address_hashed: consentHash,
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      const { data: existing } = await admin
        .from('player_consents')
        .select('id')
        .eq('user_id', id)
        .limit(1);
      if (!existing?.length) {
        const { error: insertError } = await admin.from('player_consents').insert({
          user_id: id,
          health_data_consent_at: now,
          terms_accepted_at: now,
          ip_address_hashed: consentHash,
        });
        if (insertError) throw insertError;
      }
    }
  }

  for (const { id, spec } of playerIds) {
    await admin.from('cycle_logs').delete().eq('user_id', id);
    await admin.from('session_summaries').delete().eq('user_id', id);

    if (spec.logHoursAgo !== undefined && spec.phase) {
      const loggedAt = new Date(Date.now() - spec.logHoursAgo * 60 * 60 * 1000).toISOString();
      const { error } = await admin.from('cycle_logs').insert({
        user_id: id,
        phase: spec.phase,
        energy_level: spec.energyLevel ?? null,
        symptoms: spec.symptoms ?? [],
        notes: null,
        logged_at: loggedAt,
      });
      if (error) throw error;
    }

    if (spec.session) {
      const startedAt = new Date(Date.now() - spec.session.hoursAgo * 60 * 60 * 1000).toISOString();
      const { error } = await admin.from('session_summaries').insert({
        user_id: id,
        session_id: randomUUID(),
        started_at: startedAt,
        duration_minutes: spec.session.durationMinutes,
        distance_km: spec.session.distanceKm,
        avg_heart_rate: spec.session.avgHeartRate,
        max_speed_kmh: null,
        load_score: spec.session.loadScore,
      });
      if (error) throw error;
    }
  }

  console.log('\n✓ Demo seed complete.\n');
  console.log('Team:', TEAM_NAME);
  console.log('Slug (reference):', TEAM_SLUG);
  console.log('Password (all accounts):', DEMO_PASSWORD);
  console.log('\nClub Admin login:', DEMO_CLUB_ADMIN.email, '→ /admin/teams');
  console.log('Trainer login:', DEMO_TRAINER.email);
  console.log('Sample player:', DEMO_PLAYERS[2].email, '(REST — live demo log)');
  console.log('Load demo:', DEMO_PLAYERS[1].email, '(HIGH load session)');
  console.log('\nExpected trainer ampel:');
  console.log('  FIT: Anna, Mia');
  console.log('  MODIFIED: Sara, Nina');
  console.log('  REST: Lisa Weber');
  console.log('  NO_DATA: Lea (no log), Julia (stale >48h)');
  console.log('\nSee docs/pitch/DEMO-SCRIPT.md for the 5-min flow.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
