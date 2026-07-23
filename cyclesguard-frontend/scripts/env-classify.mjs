#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error('missing file');
  process.exit(1);
}
const t = readFileSync(file, 'utf8');
for (const line of t.split('\n')) {
  const s = line.trim();
  if (!s || s.startsWith('#')) continue;
  const i = s.indexOf('=');
  if (i < 0) continue;
  const k = s.slice(0, i);
  let v = s.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  let kind = 'opaque';
  if (v.startsWith('eyJ')) kind = 'jwt';
  else if (v.startsWith('http')) kind = 'url';
  else if (v.startsWith('@')) kind = 'at-ref';
  else if (/your-|changeme|fake|example/i.test(v)) kind = 'placeholder';
  else if (v.length < 20) kind = 'short';
  console.log(`${k} len=${v.length} kind=${kind}`);
}
