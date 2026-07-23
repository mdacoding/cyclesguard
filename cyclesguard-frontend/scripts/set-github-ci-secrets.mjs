#!/usr/bin/env node
/**
 * Set GitHub Actions secrets for CyclesGuard CI from git credentials + .env.local.
 * Never prints secret values.
 *
 * Usage (repo root or frontend):
 *   node scripts/set-github-ci-secrets.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const gh =
  process.env.GH_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\GitHub CLI\\gh.exe'
    : 'gh');

function loadEnvLocal() {
  const candidates = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), 'cyclesguard-frontend', '.env.local'),
  ];
  const map = {};
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      map[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    break;
  }
  return map;
}

function gitCredentialPassword() {
  const res = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
    shell: true,
  });
  if (res.status !== 0) return null;
  const lines = (res.stdout || '').split('\n');
  let password = null;
  for (const line of lines) {
    if (line.startsWith('password=')) password = line.slice('password='.length).trim();
  }
  return password;
}

function setSecret(name, value, env) {
  if (!value) {
    console.log(`○ ${name} — missing value, skip`);
    return false;
  }
  const res = spawnSync(gh, ['secret', 'set', name, '--body', value], {
    encoding: 'utf8',
    shell: true,
    env,
  });
  if (res.status !== 0) {
    console.error(`✗ ${name} — ${(res.stderr || res.stdout || '').trim()}`);
    return false;
  }
  console.log(`✓ ${name}`);
  return true;
}

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || gitCredentialPassword();
if (!token) {
  console.error('No GitHub token. Run: gh auth login');
  process.exit(1);
}

const env = { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token };
const local = loadEnvLocal();

// Ensure we're in repo root for gh
const rootProbe = spawnSync(gh, ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
  encoding: 'utf8',
  shell: true,
  env,
});
if (rootProbe.status !== 0) {
  console.error('gh repo view failed — run from git repo after gh auth.');
  process.exit(1);
}
console.log(`Repo: ${(rootProbe.stdout || '').trim()}`);

const pairs = [
  ['E2E_TRAINER_EMAIL', process.env.E2E_TRAINER_EMAIL || 'trainer@eintracht-demo.de'],
  ['E2E_TRAINER_PASSWORD', process.env.E2E_TRAINER_PASSWORD || 'CyclesGuard2026!'],
  ['E2E_ADMIN_EMAIL', process.env.E2E_ADMIN_EMAIL || 'admin@eintracht-demo.de'],
  ['E2E_ADMIN_PASSWORD', process.env.E2E_ADMIN_PASSWORD || 'CyclesGuard2026!'],
  ['E2E_PLAYER_EMAIL', process.env.E2E_PLAYER_EMAIL || 'anna.mueller@eintracht-demo.de'],
  ['E2E_PLAYER_PASSWORD', process.env.E2E_PLAYER_PASSWORD || 'CyclesGuard2026!'],
  ['NEXT_PUBLIC_SUPABASE_URL', local.NEXT_PUBLIC_SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', local.NEXT_PUBLIC_SUPABASE_ANON_KEY],
];

let ok = 0;
for (const [k, v] of pairs) {
  if (setSecret(k, v, env)) ok += 1;
}

console.log(`Done: ${ok}/${pairs.length} secrets set.`);
if (ok < pairs.length) process.exit(1);
