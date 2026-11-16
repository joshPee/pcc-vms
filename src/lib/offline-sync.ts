/**
 * Offline Sync Queue & Idempotency Management for Gate Station Terminal
 */

export interface QueuedGateAction {
  id: string; // Idempotency key (UUID or timestamp-random)
  action: 'CHECK_IN' | 'CHECK_OUT';
  endpoint: string;
  payload: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

export class OfflineSyncQueue {
  private queue: QueuedGateAction[] = [];

  constructor(initialItems: QueuedGateAction[] = []) {
    this.queue = [...initialItems];
  }

  public enqueue(action: Omit<QueuedGateAction, 'id' | 'createdAt' | 'retryCount'>): QueuedGateAction {
    const item: QueuedGateAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };
    this.queue.push(item);
    return item;
  }

  public getPending(): QueuedGateAction[] {
    return [...this.queue];
  }

  public get pendingCount(): number {
    return this.queue.length;
  }

  public remove(id: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((item) => item.id !== id);
    return this.queue.length < initialLength;
  }

  public markRetry(id: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.retryCount += 1;
    }
  }

  public clear(): void {
    this.queue = [];
  }
}
