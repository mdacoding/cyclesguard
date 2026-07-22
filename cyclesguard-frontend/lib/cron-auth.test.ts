import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeCron } from '@/lib/cron-auth';

test('authorizeCron rejects missing secret', () => {
  const prev = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const req = new Request('http://localhost/api/cron/retention', {
    headers: { authorization: 'Bearer x' },
  });
  assert.equal(authorizeCron(req), false);
  if (prev !== undefined) process.env.CRON_SECRET = prev;
});

test('authorizeCron accepts matching Bearer token', () => {
  const prev = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-secret';
  const ok = new Request('http://localhost/api/cron/retention', {
    headers: { authorization: 'Bearer test-secret' },
  });
  const bad = new Request('http://localhost/api/cron/retention', {
    headers: { authorization: 'Bearer wrong' },
  });
  assert.equal(authorizeCron(ok), true);
  assert.equal(authorizeCron(bad), false);
  if (prev !== undefined) process.env.CRON_SECRET = prev;
  else delete process.env.CRON_SECRET;
});
