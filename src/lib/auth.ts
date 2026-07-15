import { prisma } from '@/db'
import { env } from '@/env'
import { sendVerificationEmail } from '@/server/email/verification-email'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  account: {
    accountLinking: {
      requireLocalEmailVerified: true,
      updateUserInfoOnLink: false,
      trustedProviders: ['spotify'],
    },
  },
  emailAndPassword: {
    autoSignIn: false,
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    expiresIn: 60 * 60, // 1 hour
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        url,
      })
    },
  },
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    spotify: {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
    },
  },
  plugins: [tanstackStartCookies()],
  trustedOrigins: [env.BETTER_AUTH_URL],
})
