import * as crypto from 'crypto';

/**
 * Generates a cryptographically random temporary password.
 * Returns 6 random bytes encoded as a 12-character hex string.
 *
 * Example output: "a3f2b1c9d4e6"
 */
export function generatePassword(): string {
  return crypto.randomBytes(6).toString('hex');
}
