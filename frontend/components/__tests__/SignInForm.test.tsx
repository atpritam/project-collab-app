import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignInForm from '../auth/SignInForm'
import { useSession, signIn } from 'next-auth/react'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => '/dashboard'),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
    mockSignIn.mockResolvedValue(undefined)
  })

  it('renders sign in form correctly', () => {
    render(<SignInForm />)
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText('Need an account?')).toBeInTheDocument()
  })

  it('displays validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    // HTML5 validation should prevent submission
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/password/i)).toBeRequired()
  })

  it('handles form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: null,
      status: 200,
      ok: true,
      url: '/dashboard',
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'Password123!',
      })
    })
  })

  it('displays error message for invalid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: 'Invalid email or password',
      status: 401,
      ok: false,
      url: null,
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'WrongPassword123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('displays unverified email message and resend button', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: JSON.stringify({
        emailVerified: false,
        email: 'test@example.com',
      }),
      status: 403,
      ok: false,
      url: null,
    })
    
    // Mock successful resend verification
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Verification email sent successfully' }),
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email not verified')).toBeInTheDocument()
      expect(screen.getByText('Please verify your email address before signing in.')).toBeInTheDocument()
      expect(screen.getByText('Resend verification email')).toBeInTheDocument()
    })
    
    // Test resend verification
    const resendButton = screen.getByText('Resend verification email')
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    })
  })

  it('handles social sign in buttons', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const googleButton = screen.getByText('Google')
    const githubButton = screen.getByText('GitHub')
    
    await user.click(googleButton)
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    
    await user.click(githubButton)
    expect(mockSignIn).toHaveBeenCalledWith('github', { callbackUrl: '/dashboard' })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    // Mock a delayed response
    mockSignIn.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({
        error: null,
        status: 200,
        ok: true,
        url: '/dashboard',
      }), 100)
    ))
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument()
    })
  })

  it('handles resend verification loading state', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: JSON.stringify({
        emailVerified: false,
        email: 'test@example.com',
      }),
      status: 403,
      ok: false,
      url: null,
    })
    
    // Mock delayed resend response
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Verification email sent successfully' }),
      }), 100)
    ))
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email not verified')).toBeInTheDocument()
    })
    
    const resendButton = screen.getByText('Resend verification email')
    await user.click(resendButton)
    
    // Should show loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument()
    expect(resendButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('Verification email sent')).toBeInTheDocument()
    })
  })

  it('navigates to forgot password page', () => {
    render(<SignInForm />)
    
    const forgotPasswordLink = screen.getByText('Forgot password?')
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
  })

  it('navigates to sign up page', () => {
    render(<SignInForm />)
    
    const signUpLink = screen.getByText('Sign up')
    expect(signUpLink).toHaveAttribute('href', '/auth/signup')
  })
})
