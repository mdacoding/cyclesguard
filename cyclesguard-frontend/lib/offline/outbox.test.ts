import test from 'node:test';
import assert from 'node:assert/strict';
import { isOffline, OUTBOX_SYNC_TAG } from '@/lib/offline/outbox';

test('OUTBOX_SYNC_TAG stays stable for service worker Background Sync', () => {
  assert.equal(OUTBOX_SYNC_TAG, 'cyclesguard-outbox');
});

test('isOffline mirrors navigator.onLine when available', () => {
  if (typeof navigator === 'undefined') {
    assert.equal(isOffline(), false);
    return;
  }
  assert.equal(isOffline(), navigator.onLine === false);
});
