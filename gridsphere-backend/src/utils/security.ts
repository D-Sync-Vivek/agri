import bcrypt from "bcryptjs";

// Matches passlib's CryptContext(schemes=["bcrypt"]) default work factor behavior closely enough (12 rounds).
const SALT_ROUNDS = 12;

/**
 * Equivalent of app/utils/security.py -> get_password_hash
 */
export async function getPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Equivalent of app/utils/security.py -> verify_password
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
