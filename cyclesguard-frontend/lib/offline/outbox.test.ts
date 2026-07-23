import test from 'node:test';
import assert from 'node:assert/strict';
import { OUTBOX_SYNC_TAG } from '@/lib/offline/outbox';

test('OUTBOX_SYNC_TAG stays stable for service worker Background Sync', () => {
  assert.equal(OUTBOX_SYNC_TAG, 'cyclesguard-outbox');
});
