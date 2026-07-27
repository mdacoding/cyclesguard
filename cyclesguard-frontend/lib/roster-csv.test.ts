import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRosterCsv } from './roster-csv';

test('parses a header-based CSV with all fields', () => {
  const csv = [
    'first_name,last_name,email,jersey_number,position',
    'Anna,Müller,anna@verein.de,7,Stürmerin',
    'Lisa,Weber,lisa@verein.de,,',
  ].join('\n');
  const result = parseRosterCsv(csv);
  assert.equal(result.headerDetected, true);
  assert.equal(result.invalidRows.length, 0);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].fullName, 'Anna Müller');
  assert.equal(result.rows[0].jerseyNumber, 7);
  assert.equal(result.rows[0].position, 'Stürmerin');
  assert.equal(result.rows[1].jerseyNumber, null);
  assert.equal(result.rows[1].position, null);
});

test('falls back to positional columns without a header row', () => {
  const csv = 'Anna,Müller,anna@verein.de,7,Stürmerin';
  const result = parseRosterCsv(csv);
  assert.equal(result.headerDetected, false);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].email, 'anna@verein.de');
});

test('flags invalid email format with a line number', () => {
  const csv = [
    'first_name,last_name,email',
    'Anna,Müller,not-an-email',
  ].join('\n');
  const result = parseRosterCsv(csv);
  assert.equal(result.rows.length, 0);
  assert.equal(result.invalidRows.length, 1);
  assert.equal(result.invalidRows[0].line, 2);
  assert.match(result.invalidRows[0].errors.join(' '), /E-Mail/);
});

test('flags missing required name fields', () => {
  const csv = ['first_name,last_name,email', ',,anna@verein.de'].join('\n');
  const result = parseRosterCsv(csv);
  assert.equal(result.rows.length, 0);
  assert.equal(result.invalidRows.length, 1);
  assert.equal(result.invalidRows[0].errors.length, 2);
});

test('flags duplicate emails within the batch, keeping the first', () => {
  const csv = [
    'first_name,last_name,email',
    'Anna,Müller,dup@verein.de',
    'Anna,Zwei,DUP@verein.de',
  ].join('\n');
  const result = parseRosterCsv(csv);
  assert.equal(result.rows.length, 1);
  assert.equal(result.invalidRows.length, 1);
  assert.match(result.invalidRows[0].errors[0], /Doppelte E-Mail/);
});

test('flags non-numeric jersey number', () => {
  const csv = ['first_name,last_name,email,jersey_number', 'Anna,Müller,anna@verein.de,abc'].join(
    '\n'
  );
  const result = parseRosterCsv(csv);
  assert.equal(result.rows.length, 0);
  assert.equal(result.invalidRows.length, 1);
  assert.match(result.invalidRows[0].errors[0], /Trikotnummer/);
});

test('rejects jersey number out of range', () => {
  const csv = ['first_name,last_name,email,jersey_number', 'Anna,Müller,anna@verein.de,999'].join(
    '\n'
  );
  const result = parseRosterCsv(csv);
  assert.equal(result.rows.length, 0);
  assert.equal(result.invalidRows.length, 1);
});

test('never introduces health-data columns', () => {
  const csv = ['first_name,last_name,email', 'Anna,Müller,anna@verein.de'].join('\n');
  const result = parseRosterCsv(csv);
  const keys = Object.keys(result.rows[0]);
  assert.doesNotMatch(keys.join(','), /phase|symptom|cycle|energy/i);
});
