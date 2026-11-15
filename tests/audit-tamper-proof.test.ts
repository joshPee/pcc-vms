import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAuditHash,
  verifyAuditChain,
  AuditRecord,
} from '../src/lib/audit-logger';

test('Phase 1 - Task 7: Tamper-Proof Audit Logging & Hash Chaining', async (t) => {
  await t.test('computeAuditHash produces deterministic 64-character SHA-256 digest', () => {
    const input = {
      prevHash: null,
      action: 'CHECK_IN',
      details: 'Gate registration & check-in by Officer Boateng (4). Pass: PCC-V8K294.',
      userId: 4,
      officerName: 'Officer Boateng',
      ipAddress: '192.168.1.105',
      timestamp: '2026-11-15T10:30:00.000Z',
    };

    const hash1 = computeAuditHash(input);
    const hash2 = computeAuditHash(input);

    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64);
    assert.match(hash1, /^[0-9a-f]{64}$/);
    assert.equal(hash1, hash2, 'Hash must be strictly deterministic');
  });

  await t.test('verifyAuditChain validates an untampered multi-entry hash chain', () => {
    const records: AuditRecord[] = [];

    // Entry 1
    const t1 = '2026-11-15T08:00:00.000Z';
    const h1 = computeAuditHash({
      prevHash: null,
      action: 'CHECK_IN',
      details: 'Officer Mensah check-in for Kwame Osei',
      userId: 1,
      officerName: 'Officer Mensah',
      ipAddress: '10.0.0.1',
      timestamp: t1,
    });
    records.push({
      id: 1,
      prev_hash: null,
      record_hash: h1,
      action: 'CHECK_IN',
      details: 'Officer Mensah check-in for Kwame Osei',
      user_id: 1,
      officer_name: 'Officer Mensah',
      ip_address: '10.0.0.1',
      action_time: t1,
    });

    // Entry 2 (chained to h1)
    const t2 = '2026-11-15T09:15:00.000Z';
    const h2 = computeAuditHash({
      prevHash: h1,
      action: 'WATCHLIST_ALERT',
      details: 'Watchlist hit detected on visitor registration attempt',
      userId: 1,
      officerName: 'Officer Mensah',
      ipAddress: '10.0.0.1',
      timestamp: t2,
    });
    records.push({
      id: 2,
      prev_hash: h1,
      record_hash: h2,
      action: 'WATCHLIST_ALERT',
      details: 'Watchlist hit detected on visitor registration attempt',
      user_id: 1,
      officer_name: 'Officer Mensah',
      ip_address: '10.0.0.1',
      action_time: t2,
    });

    // Entry 3 (chained to h2)
    const t3 = '2026-11-15T12:45:00.000Z';
    const h3 = computeAuditHash({
      prevHash: h2,
      action: 'CHECK_OUT',
      details: 'Visitor checkout recorded at Main Gate',
      userId: 2,
      officerName: 'Officer Addo',
      ipAddress: '10.0.0.2',
      timestamp: t3,
    });
    records.push({
      id: 3,
      prev_hash: h2,
      record_hash: h3,
      action: 'CHECK_OUT',
      details: 'Visitor checkout recorded at Main Gate',
      user_id: 2,
      officer_name: 'Officer Addo',
      ip_address: '10.0.0.2',
      action_time: t3,
    });

    const verification = verifyAuditChain(records);
    assert.equal(verification.valid, true);
    assert.equal(verification.brokenIndex, undefined);
  });

  await t.test('verifyAuditChain detects altered details (in-place modification tamper)', () => {
    const t1 = '2026-11-15T08:00:00.000Z';
    const h1 = computeAuditHash({
      prevHash: null,
      action: 'WATCHLIST_DENIED',
      details: 'Entry refused for restricted individual',
      userId: 3,
      officerName: 'Officer Frimpong',
      ipAddress: '10.0.0.3',
      timestamp: t1,
    });

    const records: AuditRecord[] = [
      {
        id: 1,
        prev_hash: null,
        record_hash: h1,
        action: 'WATCHLIST_DENIED',
        // Attacker attempts to alter the log details in the database
        details: 'Entry granted without restriction (FORGED)',
        user_id: 3,
        officer_name: 'Officer Frimpong',
        ip_address: '10.0.0.3',
        action_time: t1,
      },
    ];

    const verification = verifyAuditChain(records);
    assert.equal(verification.valid, false);
    assert.equal(verification.brokenIndex, 0);
    assert.ok(verification.reason?.includes('Cryptographic tamper detected'));
  });

  await t.test('verifyAuditChain detects deleted record in hash chain', () => {
    // Generate 3 linked records
    const t1 = '2026-11-15T08:00:00.000Z';
    const h1 = computeAuditHash({
      prevHash: null,
      action: 'CHECK_IN',
      details: 'Record 1',
      userId: 1,
      timestamp: t1,
    });

    const t2 = '2026-11-15T09:00:00.000Z';
    const h2 = computeAuditHash({
      prevHash: h1,
      action: 'CHECK_IN',
      details: 'Record 2 (Victim of deletion)',
      userId: 1,
      timestamp: t2,
    });

    const t3 = '2026-11-15T10:00:00.000Z';
    const h3 = computeAuditHash({
      prevHash: h2,
      action: 'CHECK_OUT',
      details: 'Record 3',
      userId: 1,
      timestamp: t3,
    });

    // An attacker deletes Record 2 from database
    const tamperedChain: AuditRecord[] = [
      {
        id: 1,
        prev_hash: null,
        record_hash: h1,
        action: 'CHECK_IN',
        details: 'Record 1',
        user_id: 1,
        action_time: t1,
      },
      {
        id: 3,
        // prev_hash points to deleted Record 2 (h2), but preceding record is h1!
        prev_hash: h2,
        record_hash: h3,
        action: 'CHECK_OUT',
        details: 'Record 3',
        user_id: 1,
        action_time: t3,
      },
    ];

    const verification = verifyAuditChain(tamperedChain);
    assert.equal(verification.valid, false);
    assert.equal(verification.brokenIndex, 1);
    assert.ok(verification.reason?.includes('Hash chain disconnection'));
  });
});
