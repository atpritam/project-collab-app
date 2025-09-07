import { hashPassword, verifyPassword } from '../utils/hash';
import { checkPassword } from '../utils/pass';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');

describe('Authentication Utilities', () => {
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should verify passwords correctly', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MyStr0ng#Pass',
        'Test@1234',
        'ComplexP@ssw0rd',
      ];

      strongPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',      // no uppercase, numbers, special chars
        'PASSWORD',      // no lowercase, numbers, special chars
        'Password',      // no numbers, special chars
        'Password123',   // no special chars
        'Pass1!',        // too short
        '',              // empty
      ];

      weakPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false);
      });
    });

    it('should require minimum 8 characters', () => {
      expect(checkPassword('P@ss1')).toBe(false);
      expect(checkPassword('P@ssw0rd')).toBe(true);
    });

    it('should require at least one uppercase letter', () => {
      expect(checkPassword('password123!')).toBe(false);
      expect(checkPassword('Password123!')).toBe(true);
    });

    it('should require at least one lowercase letter', () => {
      expect(checkPassword('PASSWORD123!')).toBe(false);
      expect(checkPassword('Password123!')).toBe(true);
    });

    it('should require at least one number', () => {
      expect(checkPassword('Password!')).toBe(false);
      expect(checkPassword('Password123!')).toBe(true);
    });

    it('should require at least one special character', () => {
      expect(checkPassword('Password123')).toBe(false);
      expect(checkPassword('Password123!')).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'hashed-test-password';
      
      // Mock hash to return a specific value
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      
      // Mock compare to return true when comparing the same password
      mockBcrypt.compare.mockImplementation((plain, hashed) => {
        return Promise.resolve(plain === password && hashed === hashedPassword);
      });

      const hashResult = await hashPassword(password);
      const verifyResult = await verifyPassword(password, hashResult);

      expect(hashResult).toBe(hashedPassword);
      expect(verifyResult).toBe(true);
    });

    it('should reject verification with different password', async () => {
      const originalPassword = 'OriginalPassword123!';
      const differentPassword = 'DifferentPassword123!';
      const hashedPassword = 'hashed-original-password';
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockBcrypt.compare.mockImplementation((plain, hashed) => {
        return Promise.resolve(plain === originalPassword && hashed === hashedPassword);
      });

      const hashResult = await hashPassword(originalPassword);
      const verifyResult = await verifyPassword(differentPassword, hashResult);

      expect(hashResult).toBe(hashedPassword);
      expect(verifyResult).toBe(false);
    });
  });
});
