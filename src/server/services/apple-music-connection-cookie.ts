import { createHash, randomBytes } from 'node:crypto'

export const APPLE_MUSIC_CONNECTION_COOKIE = 'encore_apple_music_connection'

const APPLE_MUSIC_CONNECTION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export function createAppleMusicConnectionKey() {
  return randomBytes(32).toString('base64url')
}

export function hashAppleMusicConnectionKey(connectionKey: string) {
  return createHash('sha256').update(connectionKey).digest('hex')
}

export function getAppleMusicConnectionKey(headers: Headers) {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  for (const cookie of cookieHeader.split(';')) {
    const [name, ...value] = cookie.trim().split('=')
    if (name === APPLE_MUSIC_CONNECTION_COOKIE) {
      return value.join('=') || null
    }
  }

  return null
}

export function createAppleMusicConnectionCookie(connectionKey: string) {
  return serializeCookie(
    connectionKey,
    APPLE_MUSIC_CONNECTION_COOKIE_MAX_AGE_SECONDS,
  )
}

export function clearAppleMusicConnectionCookie() {
  return serializeCookie('', 0)
}

function serializeCookie(value: string, maxAge: number) {
  const attributes = [
    `${APPLE_MUSIC_CONNECTION_COOKIE}=${value}`,
    'Path=/api/trpc',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]

  // Vite's local dev server does not always set NODE_ENV. Restrict Secure to
  // production so browsers accept the cookie over local HTTP while Vercel
  // deployments retain HTTPS-only cookie transport.
  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure')
  }

  return attributes.join('; ')
}
