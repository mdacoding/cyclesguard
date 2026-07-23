#!/usr/bin/env node
/** Compare env key lengths across files — never prints values. */
import { existsSync, readFileSync } from 'node:fs';

const files = process.argv.slice(2);
const watch = new Set([
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
]);

for (const f of files) {
  if (!existsSync(f)) {
    console.log(`${f}: MISSING`);
    continue;
  }
  const t = readFileSync(f, 'utf8');
  let n = 0;
  for (const line of t.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 0) continue;
    n += 1;
    const k = s.slice(0, i);
    let v = s.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (watch.has(k)) console.log(`${f}: ${k}=len:${v.length}`);
  }
  console.log(`${f}: keys=${n}`);
}
