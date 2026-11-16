/**
 * Sync Pulse Timing & Status Logic
 */

export interface SyncPulseState {
  lastUpdated: number;
  intervalMs: number;
}

export function formatSyncTimestamp(timestampMs: number | Date): string {
  return new Date(timestampMs).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function isSyncStale(lastUpdatedMs: number, intervalMs: number = 10000, toleranceMultiplier: number = 2.5): boolean {
  const elapsed = Date.now() - lastUpdatedMs;
  return elapsed > intervalMs * toleranceMultiplier;
}

export function computeNextSyncDelay(lastUpdatedMs: number, intervalMs: number = 10000): number {
  const elapsed = Date.now() - lastUpdatedMs;
  const remaining = intervalMs - elapsed;
  return Math.max(0, remaining);
}
