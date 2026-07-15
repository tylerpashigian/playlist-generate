import { env } from '@/env'
import { Resend } from 'resend'

interface SendVerificationEmailInput {
  email: string
  name?: string | null
  url: string
}

const resend = new Resend(env.RESEND_API_KEY)

export async function sendVerificationEmail({
  email,
  name,
  url,
}: SendVerificationEmailInput) {
  const greeting = name?.trim() ? `Hi ${escapeHtml(name.trim())},` : 'Hi,'
  const escapedUrl = escapeHtml(url)

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    template: {
      id: 'verify-email',
      variables: {
        first_name: greeting,
        verification_url: escapedUrl,
      },
    },
    subject: 'Verify your Encore email',
  })

  if (result.error) {
    throw new Error('Failed to send verification email')
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
