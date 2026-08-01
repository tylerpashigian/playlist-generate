import { env } from '@/env'
import { importPKCS8, SignJWT } from 'jose'

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 30
const CACHE_SKEW_SECONDS = 60 * 5

let cachedToken: { value: string; expiresAt: Date } | null = null

export function parseAppleMusicAllowedOrigins({
  configuredOrigins,
  betterAuthUrl,
  isProduction,
}: {
  configuredOrigins: string | undefined
  betterAuthUrl: string
  isProduction: boolean
}) {
  if (!configuredOrigins) {
    if (isProduction) {
      throw new Error(
        'APPLE_MUSIC_ALLOWED_ORIGINS must be configured in production.',
      )
    }

    return []
  }

  const origins = configuredOrigins.split(',').map((value) => {
    const url = new URL(value.trim())

    if (url.origin !== value.trim()) {
      throw new Error(
        'APPLE_MUSIC_ALLOWED_ORIGINS must contain origins without paths or trailing slashes.',
      )
    }

    return url.origin
  })

  if (origins.length === 0) {
    throw new Error('APPLE_MUSIC_ALLOWED_ORIGINS must not be empty.')
  }

  const canonicalOrigin = new URL(betterAuthUrl).origin
  if (!origins.includes(canonicalOrigin)) {
    throw new Error(
      'APPLE_MUSIC_ALLOWED_ORIGINS must include the BETTER_AUTH_URL origin.',
    )
  }

  return [...new Set(origins)]
}

function getAllowedOrigins() {
  return parseAppleMusicAllowedOrigins({
    configuredOrigins: env.APPLE_MUSIC_ALLOWED_ORIGINS,
    betterAuthUrl: env.BETTER_AUTH_URL,
    isProduction: process.env.NODE_ENV === 'production',
  })
}

function getPrivateKey() {
  return Buffer.from(env.APPLE_MUSIC_PRIVATE_KEY_BASE64, 'base64').toString(
    'utf8',
  )
}

export async function getAppleMusicDeveloperToken() {
  const now = new Date()

  if (
    cachedToken &&
    cachedToken.expiresAt.getTime() - now.getTime() > CACHE_SKEW_SECONDS * 1000
  ) {
    return cachedToken
  }

  const privateKey = await importPKCS8(getPrivateKey(), 'ES256')
  const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_SECONDS * 1000)
  const allowedOrigins = getAllowedOrigins()
  const tokenBuilder = new SignJWT(
    allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined,
  )
    .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_MUSIC_KEY_ID })
    .setIssuer(env.APPLE_MUSIC_TEAM_ID)
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))

  const token = await tokenBuilder.sign(privateKey)

  cachedToken = { value: token, expiresAt }
  return cachedToken
}

export function resetAppleMusicDeveloperTokenCache() {
  cachedToken = null
}
