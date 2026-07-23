#!/usr/bin/env node
/**
 * Opens the AVV draft as a mailto: draft for Founder send (A4).
 * Recipient defaults empty — set AVV_TO=... when Club/DSB address is known.
 *
 * Usage:
 *   npm run open:avv-mailto
 *   $env:AVV_TO="dsb@verein.de"; npm run open:avv-mailto
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const draftPath = join(repoRoot, 'docs/pitch/AVV-EMAIL-DRAFT.md');
const md = readFileSync(draftPath, 'utf8');

const subjectMatch = md.match(/## Betreff\r?\n\r?\n([^\r\n]+)/);
const bodyMatch = md.match(/## E-Mail-Text\r?\n\r?\n```([\s\S]*?)```/);
const subject = (subjectMatch?.[1] || 'CyclesGuard Soft-Pilot — AVV/TOM-Entwurf').trim();
const body = (bodyMatch?.[1] || '').trim();
const to = (process.env.AVV_TO || '').trim();

const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

if (process.platform === 'win32') {
  spawnSync('cmd', ['/c', 'start', '', mailto], { stdio: 'ignore' });
} else if (process.platform === 'darwin') {
  spawnSync('open', [mailto], { stdio: 'ignore' });
} else {
  spawnSync('xdg-open', [mailto], { stdio: 'ignore' });
}

console.log(to ? `✓ Mailto opened → ${to}` : '✓ Mailto draft opened (set AVV_TO when DSB address is known)');
console.log('Attach / link: docs/privacy/AVV-TOM-DRAFT.md');
