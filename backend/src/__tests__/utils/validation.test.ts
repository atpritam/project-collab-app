import { validate, authValidation, messageValidation, sanitizeHtml } from '../../middleware/validation';
import { Request, Response, NextFunction } from 'express';

// Mock request, response, and next function
const mockRequest = (body: any) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate middleware', () => {
    it('should pass validation for valid data', () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      const middleware = validate(authValidation.register);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', () => {
      const req = mockRequest({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      const middleware = validate(authValidation.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: expect.stringContaining('email'),
        details: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      const req = mockRequest({
        email: 'test@example.com',
        // missing password and name
      });
      const res = mockResponse();
      const next = mockNext;

      const middleware = validate(authValidation.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: expect.stringContaining('password'),
        details: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject password that is too short', () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      const middleware = validate(authValidation.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: expect.stringContaining('password'),
        details: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject name that is too long', () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'A'.repeat(101), // 101 characters
      });
      const res = mockResponse();
      const next = mockNext;

      const middleware = validate(authValidation.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: expect.stringContaining('name'),
        details: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authValidation schemas', () => {
    describe('register schema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        };

        const { error } = authValidation.register.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Test User',
        };

        const { error } = authValidation.register.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('email');
      });

      it('should reject short password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        };

        const { error } = authValidation.register.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('password');
      });
    });

    describe('login schema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        const { error } = authValidation.login.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing password', () => {
        const invalidData = {
          email: 'test@example.com',
        };

        const { error } = authValidation.login.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('password');
      });
    });

    describe('resetPassword schema', () => {
      it('should validate correct reset password data', () => {
        const validData = {
          token: 'reset-token-123',
          password: 'NewPassword123!',
        };

        const { error } = authValidation.resetPassword.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing token', () => {
        const invalidData = {
          password: 'NewPassword123!',
        };

        const { error } = authValidation.resetPassword.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('token');
      });
    });
  });

  describe('messageValidation schemas', () => {
    it('should validate correct message data', () => {
      const validData = {
        senderId: 'user-123',
        receiverId: 'user-456',
        content: 'Hello, this is a test message!',
      };

      const { error } = messageValidation.send.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject empty content', () => {
      const invalidData = {
        senderId: 'user-123',
        receiverId: 'user-456',
        content: '',
      };

      const { error } = messageValidation.send.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('content');
    });

    it('should reject content that is too long', () => {
      const invalidData = {
        senderId: 'user-123',
        receiverId: 'user-456',
        content: 'A'.repeat(1001), // 1001 characters
      };

      const { error } = messageValidation.send.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('content');
    });
  });

  describe('sanitizeHtml middleware', () => {
    it('should sanitize script tags from strings', () => {
      const req = mockRequest({
        content: '<script>alert("xss")</script>Hello World',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      sanitizeHtml(req, res, next);

      expect(req.body.content).toBe('Hello World');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize javascript: URLs', () => {
      const req = mockRequest({
        content: 'javascript:alert("xss")',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      sanitizeHtml(req, res, next);

      expect(req.body.content).toBe('alert("xss")');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize event handlers', () => {
      const req = mockRequest({
        content: '<div onclick="alert(\'xss\')">Click me</div>',
        name: 'Test User',
      });
      const res = mockResponse();
      const next = mockNext;

      sanitizeHtml(req, res, next);

      expect(req.body.content).toBe('<div "alert(\'xss\')">Click me</div>');
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const req = mockRequest({
        user: {
          name: 'Test User',
          bio: '<script>alert("xss")</script>Bio content',
        },
        comments: [
          'Normal comment',
          '<script>alert("xss")</script>Malicious comment',
        ],
      });
      const res = mockResponse();
      const next = mockNext;

      sanitizeHtml(req, res, next);

      expect(req.body.user.bio).toBe('Bio content');
      expect(req.body.comments[0]).toBe('Normal comment');
      expect(req.body.comments[1]).toBe('Malicious comment');
      expect(next).toHaveBeenCalled();
    });

    it('should handle non-string values', () => {
      const req = mockRequest({
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nullValue: null,
      });
      const res = mockResponse();
      const next = mockNext;

      sanitizeHtml(req, res, next);

      expect(req.body.number).toBe(123);
      expect(req.body.boolean).toBe(true);
      expect(req.body.array).toEqual([1, 2, 3]);
      expect(req.body.nullValue).toBe(null);
      expect(next).toHaveBeenCalled();
    });
  });
});
