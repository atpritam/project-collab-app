import { hashPassword, verifyPassword } from '../../utils/hash';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');

describe('Hash Utilities', () => {
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with correct salt rounds', async () => {
      const password = 'Password123!';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = 'hashed-empty-password';
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@ssw0rd!@#$%^&*()';
      const hashedPassword = 'hashed-special-password';
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plainPassword = 'WrongPassword123!';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const plainPassword = '';
      const hashedPassword = 'hashed-password-123';
      
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle null/undefined hashed password', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = null as any;
      
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('Integration tests', () => {
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
