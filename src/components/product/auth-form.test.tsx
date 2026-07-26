// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthForm } from './auth-form'

const authMocks = vi.hoisted(() => ({
  isAuthenticating: false,
  signInWithGoogle: vi.fn(),
  signInWithSpotify: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-auth-session', () => ({
  useAuthSession: () => ({
    authError: null,
    isAuthenticating: authMocks.isAuthenticating,
    isSendingVerificationEmail: false,
    isSessionLoading: false,
    user: null,
    verificationEmail: null,
    resendVerificationEmail: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: authMocks.signInWithGoogle,
    signInWithSpotify: authMocks.signInWithSpotify,
    signOut: vi.fn(),
    signUp: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  authMocks.isAuthenticating = false
})

describe('AuthForm', () => {
  it('offers Google before Spotify and starts the selected social sign-in', () => {
    render(<AuthForm redirect="/app" />)

    expect(
      screen.getByText(
        'Use email, Google, or Spotify to access your app account.',
      ),
    ).toBeTruthy()

    const googleButton = screen.getByRole('button', {
      name: 'Continue with Google',
    })
    const spotifyButton = screen.getByRole('button', {
      name: 'Continue with Spotify',
    })

    expect(
      googleButton.compareDocumentPosition(spotifyButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    fireEvent.click(googleButton)
    fireEvent.click(spotifyButton)

    expect(authMocks.signInWithGoogle).toHaveBeenCalledWith('/app')
    expect(authMocks.signInWithSpotify).toHaveBeenCalledWith('/app')
  })

  it('disables both social providers while authentication is in progress', () => {
    authMocks.isAuthenticating = true

    render(<AuthForm />)

    const waitingButtons = screen.getAllByRole('button', {
      name: 'Please wait',
    })

    expect(waitingButtons).toHaveLength(3)
    expect(
      waitingButtons.every((button) => button.hasAttribute('disabled')),
    ).toBe(true)
  })

  it('explains how to verify an unlinked Google account', () => {
    render(<AuthForm verificationError="account_not_linked" />)

    expect(
      screen.getByText(
        'That Google account is not linked yet. Sign in with your existing method, then verify your email from Profile before trying Google again.',
      ),
    ).toBeTruthy()
  })
})
