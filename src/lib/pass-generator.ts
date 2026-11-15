import { sql } from './db';

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a random non-sequential pass code with PCC-V prefix (e.g. PCC-V8K294)
 */
export function generateRandomPassNumber(): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `PCC-V${suffix}`;
}

/**
 * Generates and ensures a unique visitor pass number in the database
 */
export async function getUniquePassNumber(): Promise<string> {
  if (!sql) {
    return generateRandomPassNumber();
  }

  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const candidate = generateRandomPassNumber();
    const existing = await sql`
      SELECT id FROM participants 
      WHERE registration_code = ${candidate} 
         OR pass_number = ${candidate}
      LIMIT 1
    `;
    if (existing.length === 0) {
      return candidate;
    }
    attempts++;
  }

  // Fallback with timestamp component if collision occurs
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PCC-V${Date.now().toString(36).slice(-3).toUpperCase()}${rand}`;
}

