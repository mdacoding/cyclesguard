import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAppRole } from './roles';

describe('invite role guards', () => {
  it('treats missing role as player (safe for roster add)', () => {
    assert.equal(getAppRole({ app_metadata: {} }), 'player');
    assert.equal(getAppRole(null), 'player');
  });

  it('detects elevated roles that must not be invited as players', () => {
    assert.equal(getAppRole({ app_metadata: { role: 'trainer' } }), 'trainer');
    assert.equal(getAppRole({ app_metadata: { role: 'club_admin' } }), 'club_admin');
  });
});
