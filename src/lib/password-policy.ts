/**
 * Password Policy and Session Hardening Rules for PCC VMS
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates password strength according to enterprise security standards:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 * - At least one special symbol
 */
export function validatePasswordStrength(password?: string | null): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required.'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters in length.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter (A-Z).');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter (a-z).');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one digit (0-9).');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push('Password must include at least one special character.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Session timeout policy (in seconds).
 * Gate tablet stations have shorter idle session lifetimes (4 hours) to limit exposure on shared terminals.
 * Administrative workstations have standard 8-hour shift sessions.
 */
export const SESSION_MAX_AGE_SECONDS = {
  GUARD_STATION: 4 * 60 * 60, // 4 hours
  ADMIN_PORTAL: 8 * 60 * 60,  // 8 hours
};

export function getSessionMaxAgeForRole(role?: string | null): number {
  if (role === 'security_officer') {
    return SESSION_MAX_AGE_SECONDS.GUARD_STATION;
  }
  return SESSION_MAX_AGE_SECONDS.ADMIN_PORTAL;
}
