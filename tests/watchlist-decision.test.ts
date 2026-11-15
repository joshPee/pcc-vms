import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  phoneMatches,
  nameSimilarity,
  evaluateWatchlistMatch,
  WatchlistEntry,
} from '../src/lib/watchlist-match';

test('Phase 1 - Task 3: Watchlist Matching & Guard Decision Flow', async (t) => {
  await t.test('normalizePhone formats Ghana phone numbers to canonical 0XX format', () => {
    assert.equal(normalizePhone('+233241234567'), '0241234567');
    assert.equal(normalizePhone('233241234567'), '0241234567');
    assert.equal(normalizePhone('024 123 4567'), '0241234567');
    assert.equal(normalizePhone('(024) 123-4567'), '0241234567');
    assert.equal(normalizePhone('0241234567'), '0241234567');
    assert.equal(normalizePhone(null), '');
    assert.equal(normalizePhone(undefined), '');
  });

  await t.test('phoneMatches accurately compares phone numbers across formatting styles', () => {
    assert.equal(phoneMatches('+233 24 123 4567', '0241234567'), true);
    assert.equal(phoneMatches('0241234567', '0249999999'), false);
    assert.equal(phoneMatches('', '0241234567'), false);
    assert.equal(phoneMatches(null, '0241234567'), false);
    assert.equal(phoneMatches('123', '123'), false); // too short to match safely
  });

  await t.test('nameSimilarity detects exact and fuzzy name matches', () => {
    assert.equal(nameSimilarity('Kwame Mensah', 'Kwame Mensah'), 1.0);
    assert.ok(nameSimilarity('Kwame Mensah', 'Kwami Mensah') >= 0.75);
    assert.ok(nameSimilarity('John Kofi Mensah', 'John Mensah') >= 0.6);
    assert.equal(nameSimilarity('Alice Cooper', 'Kwame Mensah'), 0);
  });

  await t.test('evaluateWatchlistMatch returns match by name only', () => {
    const entries: WatchlistEntry[] = [
      {
        id: 1,
        full_name: 'Kofi Mensah Badu',
        phone: '0200000000',
        reason: 'Restricted former contractor',
      },
    ];

    const result = evaluateWatchlistMatch(
      { fullName: 'Kofi Mensah Badu', phone: '0241112233' },
      entries
    );

    assert.ok(result);
    assert.equal(result.matchType, 'name');
    assert.equal(result.entry.full_name, 'Kofi Mensah Badu');
    assert.ok(result.confidence >= 0.75);
  });

  await t.test('evaluateWatchlistMatch returns match by phone only even if name differs', () => {
    const entries: WatchlistEntry[] = [
      {
        id: 2,
        full_name: 'Unknown Person',
        phone: '0241234567',
        reason: 'Phone associated with repeat trespassing',
      },
    ];

    const result = evaluateWatchlistMatch(
      { fullName: 'Samuel Amponsah', phone: '+233 24 123 4567' },
      entries
    );

    assert.ok(result);
    assert.equal(result.matchType, 'phone');
    assert.equal(result.confidence, 0.95);
    assert.equal(result.entry.phone, '0241234567');
  });

  await t.test('evaluateWatchlistMatch returns "both" when name and phone match', () => {
    const entries: WatchlistEntry[] = [
      {
        id: 3,
        full_name: 'Yaw Boateng',
        phone: '0245554433',
        reason: 'Barred individual',
      },
    ];

    const result = evaluateWatchlistMatch(
      { fullName: 'Yaw Boateng', phone: '0245554433' },
      entries
    );

    assert.ok(result);
    assert.equal(result.matchType, 'both');
    assert.equal(result.confidence, 1.0);
  });

  await t.test('evaluateWatchlistMatch returns null when neither name nor phone match', () => {
    const entries: WatchlistEntry[] = [
      {
        id: 4,
        full_name: 'Yaw Boateng',
        phone: '0245554433',
        reason: 'Barred individual',
      },
    ];

    const result = evaluateWatchlistMatch(
      { fullName: 'Abena Osei', phone: '0209998877' },
      entries
    );

    assert.equal(result, null);
  });
});
