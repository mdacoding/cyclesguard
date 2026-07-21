/**
 * Seeds the Eintracht Frankfurt Frauen pitch demo on Supabase Cloud or local.
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: npm run seed:eintracht
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_PASSWORD = 'CyclesGuard2026!';
const TEAM_NAME = 'Eintracht Frankfurt Frauen';
const CLUB_NAME = 'Eintracht Frankfurt';
const TEAM_SLUG = 'eintracht-frankfurt-frauen';

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

interface DemoPlayer {
  email: string;
  fullName: string;
  phase?: CyclePhase;
  energyLevel?: number | null;
  symptoms?: string[];
  /** Hours ago for logged_at; omit = no log (NO_DATA) */
  logHoursAgo?: number;
}

const DEMO_TRAINER = {
  email: 'trainer@eintracht-demo.de',
  fullName: 'Lisa Athletik (Demo)',
};

const DEMO_PLAYERS: DemoPlayer[] = [
  {
    email: 'anna.mueller@eintracht-demo.de',
    fullName: 'Anna Müller',
    phase: 'follicular',
    energyLevel: 5,
    logHoursAgo: 2,
  },
  {
    email: 'sara.klein@eintracht-demo.de',
    fullName: 'Sara Klein',
    phase: 'ovulation',
    energyLevel: 4,
    logHoursAgo: 4,
  },
  {
    email: 'lisa.weber@eintracht-demo.de',
    fullName: 'Lisa Weber',
    phase: 'menstrual',
    energyLevel: 1,
    symptoms: ['Krämpfe', 'Müdigkeit'],
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
    // no log → NO_DATA in trainer ampel
  },
  {
    email: 'julia.richter@eintracht-demo.de',
    fullName: 'Julia Richter',
    phase: 'follicular',
    energyLevel: 4,
    logHoursAgo: 72, // stale → NO_DATA (>48h)
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
    role: 'player' | 'trainer';
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

  console.log('Seeding Eintracht pitch demo…');

  const trainerId = await upsertUser(admin, {
    email: DEMO_TRAINER.email,
    password: DEMO_PASSWORD,
    fullName: DEMO_TRAINER.fullName,
    role: 'trainer',
  });
  console.log(`  Trainer: ${DEMO_TRAINER.email}`);

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
    const { data: club, error: clubError } = await admin
      .from('clubs')
      .insert({ name: CLUB_NAME })
      .select('id')
      .single();
    if (clubError) throw clubError;
    clubId = club.id;
  }

  let teamId: string;
  const { data: existingTeam } = await admin
    .from('teams')
    .select('id')
    .eq('name', TEAM_NAME)
    .maybeSingle();

  if (existingTeam?.id) {
    teamId = existingTeam.id;
    await admin.from('teams').update({ club_id: clubId, club_name: CLUB_NAME }).eq('id', teamId);
  } else {
    const { data: team, error: teamError } = await admin
      .from('teams')
      .insert({ name: TEAM_NAME, club_name: CLUB_NAME, club_id: clubId })
      .select('id')
      .single();
    if (teamError) throw teamError;
    teamId = team.id;
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
      // Fallback before migration 009 (no unique on user_id yet)
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

    if (spec.logHoursAgo === undefined || !spec.phase) continue;

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

  console.log('\n✓ Demo seed complete.\n');
  console.log('Team:', TEAM_NAME);
  console.log('Slug (reference):', TEAM_SLUG);
  console.log('Password (all accounts):', DEMO_PASSWORD);
  console.log('\nTrainer login:', DEMO_TRAINER.email);
  console.log('Sample player:', DEMO_PLAYERS[2].email, '(REST — live demo log)');
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
