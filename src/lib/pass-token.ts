import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure 128-bit unguessable hex token (32 characters).
 * Used for QR code payload generation to prevent sequential or guessed checkout forgery.
 */
export function generatePassToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Validates whether a given string matches the 128-bit hex pass token format.
 */
export function isValidPassToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^[0-9a-f]{32}$/i.test(token.trim());
}
