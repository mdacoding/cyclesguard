import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, checkRateLimitDurable } from './rate-limit';

test('checkRateLimit allows up to limit then blocks', () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  const blocked = checkRateLimit(key, 2, 60_000);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);
});

test('checkRateLimitDurable falls back to memory without admin', async () => {
  const key = `durable-${Date.now()}-${Math.random()}`;
  const a = await checkRateLimitDurable(null, key, 1, 60_000);
  assert.equal(a.source, 'memory');
  assert.equal(a.ok, true);
  const b = await checkRateLimitDurable(null, key, 1, 60_000);
  assert.equal(b.ok, false);
});
