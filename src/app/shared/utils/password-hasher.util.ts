/**
 * Password Hasher Utility
 * Provides client-side password hashing and validation
 * Note: This is for demonstration purposes. In production, password hashing should be done on the server.
 */

/**
 * Simple hash function using SHA-256-like approach
 * This creates a deterministic hash from a password string
 * @param password The password to hash
 * @returns The hashed password
 */
export function hashPassword(password: string): string {
  // Simple implementation: for production, consider using bcryptjs or server-side hashing
  let hash = 0;
  let i: number;
  let chr: number;

  if (password.length === 0) return hash.toString();

  for (i = 0; i < password.length; i++) {
    chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return 'hashed_' + Math.abs(hash).toString(16);
}

/**
 * Verify a password against a hash
 * @param password The plaintext password to verify
 * @param hash The hash to verify against
 * @returns True if password matches hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate a random temporary password
 * @param length The length of the password to generate (default: 12)
 * @returns A random temporary password
 */
export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

