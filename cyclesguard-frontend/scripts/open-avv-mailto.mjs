#!/usr/bin/env node
/**
 * Opens the AVV draft as a mailto: draft for Founder send (A4).
 * Recipient defaults empty — set AVV_TO=... when Club/DSB address is known.
 * If the mailto URL is too long for the OS mail client, prints body + writes
 * a temp .txt and copies to clipboard when possible.
 *
 * Usage:
 *   npm run open:avv-mailto
 *   $env:AVV_TO="dsb@verein.de"; npm run open:avv-mailto
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
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
const MAILTO_SAFE = 1800;

function tryClipboard(text) {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('powershell', ['-NoProfile', '-Command', 'Set-Clipboard -Value $input'], {
        input: text,
        encoding: 'utf8',
      });
      return r.status === 0;
    }
    if (process.platform === 'darwin') {
      const r = spawnSync('pbcopy', [], { input: text, encoding: 'utf8' });
      return r.status === 0;
    }
    const r = spawnSync('xclip', ['-selection', 'clipboard'], { input: text, encoding: 'utf8' });
    return r.status === 0;
  } catch {
    return false;
  }
}

if (mailto.length <= MAILTO_SAFE) {
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', mailto], { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    spawnSync('open', [mailto], { stdio: 'ignore' });
  } else {
    spawnSync('xdg-open', [mailto], { stdio: 'ignore' });
  }
  console.log(to ? `✓ Mailto opened → ${to}` : '✓ Mailto draft opened (set AVV_TO when DSB address is known)');
} else {
  const dir = mkdtempSync(join(tmpdir(), 'cyclesguard-avv-'));
  const file = join(dir, 'avv-email-body.txt');
  const payload = `To: ${to || '(DSB-Adresse einsetzen)'}\nSubject: ${subject}\n\n${body}\n`;
  writeFileSync(file, payload, 'utf8');
  const clipped = tryClipboard(payload);
  console.log('○ Mailto too long for OS mail client — body saved + clipboard fallback');
  console.log(`  File: ${file}`);
  console.log(clipped ? '  Clipboard: yes (paste into mail client)' : '  Clipboard: unavailable — open the file');
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', file], { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    spawnSync('open', [file], { stdio: 'ignore' });
  }
}

console.log('Attach / link: docs/privacy/AVV-TOM-DRAFT.md');
console.log('Live Vorlage Spielerinnen: https://cyclesguard.vercel.app/spielerinnen-info');
