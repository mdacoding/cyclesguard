#!/usr/bin/env node
/**
 * Creates .env.local with generated secrets for pitch deploy (P0.1 prep).
 * Supabase URL/keys must be filled manually after project creation.
 *
 * Usage: npm run pitch:setup-env
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import webPush from 'web-push';

const envPath = join(process.cwd(), '.env.local');
const examplePath = join(process.cwd(), '.env.example');

if (existsSync(envPath)) {
  console.log('.env.local already exists — not overwriting.');
  console.log('Delete it first or edit manually. See docs/pitch/DEPLOY.md');
  process.exit(0);
}

const vapid = webPush.generateVAPIDKeys();
const cronSecret = randomBytes(32).toString('hex');
const consentSalt = randomBytes(32).toString('hex');

let template = existsSync(examplePath)
  ? readFileSync(examplePath, 'utf8')
  : '';

template = template
  .replace('your-vapid-public-key', vapid.publicKey)
  .replace('your-vapid-private-key', vapid.privateKey);
template = template.replace('CRON_SECRET=generate-a-long-random-string', `CRON_SECRET=${cronSecret}`);
template = template.replace('CONSENT_IP_SALT=generate-a-long-random-string', `CONSENT_IP_SALT=${consentSalt}`);

if (template.includes('NEXT_PUBLIC_DEMO_MODE=')) {
  template = template.replace(/NEXT_PUBLIC_DEMO_MODE=.*/g, 'NEXT_PUBLIC_DEMO_MODE=true');
} else {
  template += '\n# Show demo login hints on /login (pitch only)\nNEXT_PUBLIC_DEMO_MODE=true\n';
}

writeFileSync(envPath, template, 'utf8');

console.log('Created .env.local with generated VAPID, CRON_SECRET, CONSENT_IP_SALT.');
console.log('');
console.log('Next steps:');
console.log('  1. Create Supabase project (Frankfurt) — docs/pitch/DEPLOY.md');
console.log('  2. Fill NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY in .env.local');
console.log('  3. Run migrations: npm run pitch:bundle-migrations → paste ALL-MIGRATIONS.sql');
console.log('  4. npm run seed:eintracht');
console.log('  5. Deploy to Vercel — docs/pitch/DEPLOY.md §5');
