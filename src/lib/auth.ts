import { prisma } from '@/db'
import { env } from '@/env'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  account: {
    accountLinking: {
      updateUserInfoOnLink: false,
      trustedProviders: ['spotify'],
    },
  },
  emailAndPassword: {
    enabled: true,
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
  trustedOrigins: [env.SERVER_URL, env.BETTER_AUTH_URL],
})
