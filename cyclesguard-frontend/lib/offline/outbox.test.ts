import test from 'node:test';
import assert from 'node:assert/strict';
import { isOffline, OUTBOX_SYNC_TAG } from '@/lib/offline/outbox';

test('OUTBOX_SYNC_TAG stays stable for service worker Background Sync', () => {
  assert.equal(OUTBOX_SYNC_TAG, 'cyclesguard-outbox');
});

test('isOffline is false when navigator.onLine is unavailable (Node / SSR)', () => {
  assert.equal(isOffline(), false);
});
