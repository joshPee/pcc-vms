import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSyncTimestamp,
  isSyncStale,
  computeNextSyncDelay,
} from '../src/lib/sync-pulse';

test('Phase 2 - Task 13: Real-Time Sync Transparency Pulse', async (t) => {
  await t.test('formats timestamp strictly as HH:MM:SS', () => {
    const ts = new Date('2026-05-10T14:22:05Z');
    const formatted = formatSyncTimestamp(ts);
    assert.match(formatted, /^\d{2}:\d{2}:\d{2}$/);
  });

  await t.test('detects when sync pulse has stalled beyond tolerance threshold', () => {
    const now = Date.now();
    // 5 seconds ago with 10s interval -> not stale
    assert.equal(isSyncStale(now - 5000, 10000), false);

    // 26 seconds ago with 10s interval (exceeds 2.5x tolerance) -> stale
    assert.equal(isSyncStale(now - 26000, 10000), true);
  });

  await t.test('computes remaining milliseconds until next sync pulse', () => {
    const now = Date.now();
    // 4 seconds elapsed on 10s interval -> ~6000ms remaining
    const delay = computeNextSyncDelay(now - 4000, 10000);
    assert.ok(delay <= 6000 && delay >= 5900);

    // 12 seconds elapsed -> 0ms remaining (immediate trigger)
    assert.equal(computeNextSyncDelay(now - 12000, 10000), 0);
  });
});
