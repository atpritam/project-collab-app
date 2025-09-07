import { 
  cn, 
  checkPassword, 
  debugLog, 
  debugError, 
  getInitials, 
  formatTime, 
  formatDate 
} from '../utils'

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2')
    })

    it('handles undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
    })

    it('handles empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2')
    })

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })
  })

  describe('checkPassword', () => {
    it('accepts valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng#Pass',
        'Test@1234',
        'ComplexP@ssw0rd',
        'A1b2C3d4!',
      ]

      validPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(true)
      })
    })

    it('rejects passwords without uppercase letters', () => {
      const invalidPasswords = [
        'password123!',
        'mystr0ng#pass',
        'test@1234',
      ]

      invalidPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false)
      })
    })

    it('rejects passwords without lowercase letters', () => {
      const invalidPasswords = [
        'PASSWORD123!',
        'MYSTR0NG#PASS',
        'TEST@1234',
      ]

      invalidPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false)
      })
    })

    it('rejects passwords without numbers', () => {
      const invalidPasswords = [
        'Password!',
        'MyStr#Pass',
        'Test@Pass',
      ]

      invalidPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false)
      })
    })

    it('rejects passwords without special characters', () => {
      const invalidPasswords = [
        'Password123',
        'MyStr0ngPass',
        'Test1234',
      ]

      invalidPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false)
      })
    })

    it('rejects passwords shorter than 8 characters', () => {
      const invalidPasswords = [
        'P@ss1',
        'My#2',
        'Test!',
      ]

      invalidPasswords.forEach(password => {
        expect(checkPassword(password)).toBe(false)
      })
    })

    it('rejects empty passwords', () => {
      expect(checkPassword('')).toBe(false)
    })
  })

  describe('debugLog', () => {
    it('logs in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      debugLog('test message', { data: 'test' })

      expect(mockConsoleLog).toHaveBeenCalledWith('test message', { data: 'test' })

      process.env.NODE_ENV = originalEnv
    })

    it('does not log in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      debugLog('test message')

      expect(mockConsoleLog).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('handles multiple arguments', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      debugLog('arg1', 'arg2', { arg3: 'value' })

      expect(mockConsoleLog).toHaveBeenCalledWith('arg1', 'arg2', { arg3: 'value' })

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('debugError', () => {
    it('logs errors in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      debugError('test error', { error: 'details' })

      expect(mockConsoleError).toHaveBeenCalledWith('test error', { error: 'details' })

      process.env.NODE_ENV = originalEnv
    })

    it('does not log errors in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      debugError('test error')

      expect(mockConsoleError).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('getInitials', () => {
    it('returns initials for full names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith')).toBe('JS')
      expect(getInitials('Bob Johnson')).toBe('BJ')
    })

    it('returns initials for single names', () => {
      expect(getInitials('John')).toBe('J')
      expect(getInitials('Jane')).toBe('J')
    })

    it('returns initials for names with multiple words', () => {
      expect(getInitials('John Michael Doe')).toBe('JMD')
      expect(getInitials('Mary Jane Watson')).toBe('MJW')
    })

    it('handles names with extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
      expect(getInitials('  Jane  ')).toBe('J')
    })

    it('returns empty string for null input', () => {
      expect(getInitials(null)).toBe('')
    })

    it('returns empty string for undefined input', () => {
      expect(getInitials(undefined as any)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(getInitials('')).toBe('')
    })

    it('handles names with special characters', () => {
      expect(getInitials('José María')).toBe('JM')
      expect(getInitials('Jean-Pierre')).toBe('J')
    })
  })

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const result = formatTime(dateString)
      
      // Should format as "2:30 PM" (assuming UTC)
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
    })

    it('handles different times', () => {
      const morningTime = '2024-01-15T09:15:00Z'
      const eveningTime = '2024-01-15T21:45:00Z'
      
      expect(formatTime(morningTime)).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
      expect(formatTime(eveningTime)).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const dateString = '2024-12-31T23:59:59Z'
      const result = formatDate(dateString)
      
      expect(result).toBe('Jan 1, 2025')
    })

    it('handles different dates', () => {
      const januaryDate = '2024-01-15T00:00:00Z'
      const julyDate = '2024-07-04T00:00:00Z'
      
      expect(formatDate(januaryDate)).toBe('Jan 15, 2024')
      expect(formatDate(julyDate)).toBe('Jul 4, 2024')
    })

    it('returns "No due date" for null input', () => {
      expect(formatDate(null)).toBe('No due date')
    })

    it('returns "No due date" for undefined input', () => {
      expect(formatDate(undefined as any)).toBe('No due date')
    })

    it('handles invalid date strings', () => {
      // This should not throw an error
      expect(() => formatDate('invalid-date')).not.toThrow()
    })
  })
})
