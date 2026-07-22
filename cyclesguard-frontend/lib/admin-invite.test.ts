import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInviteCsv } from '@/lib/admin-invite';

test('parseInviteCsv skips header and parses rows', () => {
  const csv = `email,fullName,role
anna@demo.de,Anna Müller,player
trainer@demo.de,Lisa,trainer
`;
  const { rows, errors } = parseInviteCsv(csv);
  assert.equal(errors.length, 0);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].email, 'anna@demo.de');
  assert.equal(rows[0].role, 'player');
  assert.equal(rows[1].role, 'trainer');
});

test('parseInviteCsv reports invalid email', () => {
  const { rows, errors } = parseInviteCsv('not-an-email,Name,player');
  assert.equal(rows.length, 0);
  assert.ok(errors[0]?.includes('ungültige E-Mail'));
});
