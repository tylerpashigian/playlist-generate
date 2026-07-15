import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendVerificationEmail } from './verification-email'

const resendMocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock('@/env', () => ({
  env: {
    EMAIL_FROM: 'Encore <auth@playencore.app>',
    RESEND_API_KEY: 'test-resend-key',
  },
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
      emails: {
        send: resendMocks.send,
      },
    }
  }),
}))

describe('sendVerificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resendMocks.send.mockResolvedValue({
      data: { id: 'email-id' },
      error: null,
    })
  })

  it('sends a verification email through Resend', async () => {
    await sendVerificationEmail({
      email: 'user@example.com',
      name: 'User Name',
      url: 'https://app.example.com/api/auth/verify-email?token=secret',
    })

    expect(resendMocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Encore <auth@playencore.app>',
        to: 'user@example.com',
        subject: 'Verify your Encore email',
        template: {
          id: 'verify-email',
          variables: {
            first_name: 'Hi User Name,',
            verification_url:
              'https://app.example.com/api/auth/verify-email?token=secret',
          },
        },
      }),
    )
  })

  it('escapes user-controlled template variables', async () => {
    await sendVerificationEmail({
      email: 'user@example.com',
      name: '<script>alert("x")</script>',
      url: 'https://app.example.com/verify?token=<token>',
    })

    const email = resendMocks.send.mock.calls[0]?.[0]

    expect(email.template.variables.first_name).toBe(
      'Hi &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;,',
    )
    expect(email.template.variables.verification_url).toBe(
      'https://app.example.com/verify?token=&lt;token&gt;',
    )
  })

  it('throws a generic error when Resend fails', async () => {
    resendMocks.send.mockResolvedValue({
      data: null,
      error: { message: 'provider failure' },
    })

    await expect(
      sendVerificationEmail({
        email: 'user@example.com',
        url: 'https://app.example.com/verify',
      }),
    ).rejects.toThrow('Failed to send verification email')
  })
})
