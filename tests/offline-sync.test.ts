import test from 'node:test';
import assert from 'node:assert/strict';
import { OfflineSyncQueue, QueuedGateAction } from '../src/lib/offline-sync';

test('Phase 2 - Task 11: Offline Capable Guard Terminal & Sync Queue', async (t) => {
  await t.test('enqueues gate actions with unique idempotency keys', () => {
    const queue = new OfflineSyncQueue();
    const action1 = queue.enqueue({
      action: 'CHECK_IN',
      endpoint: '/api/walk-in',
      payload: { fullName: 'Test Visitor', phone: '0240000000' },
    });

    const action2 = queue.enqueue({
      action: 'CHECK_OUT',
      endpoint: '/api/check-out',
      payload: { passNumber: 'PCC-V123456' },
    });

    assert.equal(queue.pendingCount, 2);
    assert.match(action1.id, /^sync_\d+_[a-z0-9]+$/);
    assert.notEqual(action1.id, action2.id);
  });

  await t.test('safely removes confirmed synced actions by id', () => {
    const queue = new OfflineSyncQueue();
    const item = queue.enqueue({
      action: 'CHECK_IN',
      endpoint: '/api/walk-in',
      payload: { fullName: 'Jane Doe' },
    });

    assert.equal(queue.pendingCount, 1);
    const removed = queue.remove(item.id);
    assert.equal(removed, true);
    assert.equal(queue.pendingCount, 0);
  });

  await t.test('increments retry count on network failure', () => {
    const queue = new OfflineSyncQueue();
    const item = queue.enqueue({
      action: 'CHECK_OUT',
      endpoint: '/api/check-out',
      payload: { passNumber: 'PCC-V999999' },
    });

    assert.equal(item.retryCount, 0);
    queue.markRetry(item.id);
    assert.equal(queue.getPending()[0].retryCount, 1);
  });
});
