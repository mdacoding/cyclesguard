#!/usr/bin/env node
/**
 * Restore NEXT_PUBLIC_* Supabase values from the live production JS bundle
 * into .env.local (anon key is public by design). Never prints secret values.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import https from 'node:https';

const BASE = process.argv[2] || 'https://cyclesguard.vercel.app';

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      })
      .on('error', reject);
  });
}

const html = await get(BASE);
const chunks = [...html.matchAll(/\/_next\/static\/[^"'\\s]+\.js/g)].map((m) => m[0]);
const unique = [...new Set(chunks)].slice(0, 40);

let foundUrl = null;
let foundJwt = null;

for (const path of unique) {
  const body = await get(`${BASE}${path}`);
  const urls = body.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g) || [];
  const jwts = body.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g) || [];
  if (!foundUrl && urls[0]) foundUrl = urls[0];
  // Prefer longest JWT (anon keys are long)
  for (const j of jwts) {
    if (!foundJwt || j.length > foundJwt.length) foundJwt = j;
  }
  if (foundUrl && foundJwt && foundJwt.length > 100) break;
}

if (!foundUrl || !foundJwt) {
  console.error('Could not extract public Supabase URL/anon key from production bundle.');
  process.exit(1);
}

console.log(`✓ Extracted public URL (len=${foundUrl.length}) and anon key (len=${foundJwt.length})`);

const envPath = '.env.local';
if (!existsSync(envPath)) {
  console.error('No .env.local to update');
  process.exit(1);
}

let text = readFileSync(envPath, 'utf8');
const setKey = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, `${key}=${value}`);
  else text += `\n${key}=${value}\n`;
};
setKey('NEXT_PUBLIC_SUPABASE_URL', foundUrl);
setKey('NEXT_PUBLIC_SUPABASE_ANON_KEY', foundJwt);
writeFileSync(envPath, text);
console.log('✓ Updated .env.local with public Supabase values from production bundle');
