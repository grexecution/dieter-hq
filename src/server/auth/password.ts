import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 * Use this to generate the hash for HQ_PASSWORD_HASH env var.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 * Returns true if the password matches.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    // Invalid hash format or other error
    return false;
  }
}

/**
 * Check if a string looks like a bcrypt hash.
 * Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars.
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}
