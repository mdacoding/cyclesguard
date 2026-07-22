import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '@/lib/rate-limit';

test('checkRateLimit allows up to limit then blocks', () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  const blocked = checkRateLimit(key, 2, 60_000);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);
});
