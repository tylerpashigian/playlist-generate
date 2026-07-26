import { env } from '@/env'
import { importPKCS8, SignJWT } from 'jose'

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 30
const CACHE_SKEW_SECONDS = 60 * 5

let cachedToken: { value: string; expiresAt: Date } | null = null

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
  const token = await new SignJWT()
    .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_MUSIC_KEY_ID })
    .setIssuer(env.APPLE_MUSIC_TEAM_ID)
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(privateKey)

  cachedToken = { value: token, expiresAt }
  return cachedToken
}

export function resetAppleMusicDeveloperTokenCache() {
  cachedToken = null
}
