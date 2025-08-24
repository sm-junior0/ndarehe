// utils/password.ts
import bcrypt from 'bcryptjs';

// Lower cost factor for faster verification (still secure)
const VERIFICATION_SALT_ROUNDS = 10;

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// Keep higher rounds for registration
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};