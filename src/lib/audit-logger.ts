import { createHash } from 'crypto';

export interface AuditRecord {
  id?: number;
  prev_hash?: string | null;
  record_hash: string;
  action: string;
  details: string;
  user_id?: number | null;
  officer_name?: string | null;
  ip_address?: string | null;
  action_time: string;
}

export interface AuditInput {
  prevHash?: string | null;
  action: string;
  details: string;
  userId?: number | null;
  officerName?: string | null;
  ipAddress?: string | null;
  timestamp: string;
}

/**
 * Computes a SHA-256 cryptographic hash of an audit log entry chained to the previous hash.
 */
export function computeAuditHash(input: AuditInput): string {
  const payload = [
    input.prevHash || 'GENESIS_PCC_VMS_AUDIT_TRAIL',
    input.action.trim(),
    input.details.trim(),
    input.userId ? String(input.userId) : 'ANONYMOUS_OR_SYSTEM',
    input.officerName ? input.officerName.trim() : 'UNATTRIBUTED',
    input.ipAddress ? input.ipAddress.trim() : '127.0.0.1',
    input.timestamp.trim(),
  ].join('|');

  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Verifies the mathematical integrity of a sequence of audit log entries.
 * Detects any in-place mutation of fields or omitted/deleted records.
 */
export function verifyAuditChain(
  chain: AuditRecord[]
): { valid: boolean; brokenIndex?: number; reason?: string } {
  if (!chain || chain.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const prevHash = i === 0 ? current.prev_hash || null : chain[i - 1].record_hash;

    // 1. Verify previous hash pointer matches previous record hash
    if (i > 0 && current.prev_hash !== prevHash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Hash chain disconnection at record ${i}: prev_hash does not match hash of entry ${i - 1}.`,
      };
    }

    // 2. Re-compute hash from content and compare
    const computed = computeAuditHash({
      prevHash: current.prev_hash,
      action: current.action,
      details: current.details,
      userId: current.user_id,
      officerName: current.officer_name,
      ipAddress: current.ip_address,
      timestamp: current.action_time,
    });

    if (computed !== current.record_hash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Cryptographic tamper detected at record ${i}: stored record_hash does not match recomputed SHA-256 payload.`,
      };
    }
  }

  return { valid: true };
}

