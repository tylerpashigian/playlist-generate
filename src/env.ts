import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const baseRuntimeEnv = {
  ...import.meta.env,
  ...(typeof process === 'undefined' ? {} : process.env),
}

const withHttps = (url: string) =>
  /^https?:\/\//.test(url) ? url : `https://${url}`

const vercelUrl =
  typeof baseRuntimeEnv.VERCEL_URL === 'string' &&
  baseRuntimeEnv.VERCEL_URL.length > 0
    ? withHttps(baseRuntimeEnv.VERCEL_URL)
    : undefined

const betterAuthUrl = baseRuntimeEnv.BETTER_AUTH_URL || vercelUrl

const runtimeEnv = {
  ...baseRuntimeEnv,
  BETTER_AUTH_URL: betterAuthUrl,
}

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.string().min(1),
    EMAIL_FROM: z.string().min(1).default('Encore <auth@playencore.app>'),
    RESEND_API_KEY: z.string().min(1),
    SETLISTFM_API_KEY: z.string().min(1),
    SPOTIFY_CLIENT_ID: z.string().min(1),
    SPOTIFY_CLIENT_SECRET: z.string().min(1),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {},

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
