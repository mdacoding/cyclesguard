#!/usr/bin/env node
/**
 * Bundles supabase/migrations/001–008 into one SQL file for Supabase SQL Editor (P0.2).
 * Usage: npm run pitch:bundle-migrations
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const outPath = join(process.cwd(), '..', 'docs', 'pitch', 'ALL-MIGRATIONS.sql');

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const parts = files.map((file) => {
  const sql = readFileSync(join(migrationsDir, file), 'utf8').trim();
  return `-- =============================================================================\n-- ${file}\n-- =============================================================================\n\n${sql}`;
});

const header = `-- CyclesGuard — combined migrations 001–008\n-- Run once on a fresh Supabase project (SQL Editor → New query → Run)\n-- Generated: ${new Date().toISOString()}\n\n`;

writeFileSync(outPath, header + parts.join('\n\n') + '\n');
console.log(`Wrote ${outPath} (${files.length} files)`);
