import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  APPLE_MUSIC_CONNECTION_COOKIE,
  clearAppleMusicConnectionCookie,
  createAppleMusicConnectionCookie,
  getAppleMusicConnectionKey,
  hashAppleMusicConnectionKey,
} from './apple-music-connection-cookie'

describe('Apple Music connection cookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses a secure HTTP-only cookie outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const cookie = createAppleMusicConnectionCookie('connection-key')

    expect(cookie).toContain(`${APPLE_MUSIC_CONNECTION_COOKIE}=connection-key`)
    expect(cookie).toContain('Path=/api/trpc')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=15552000')
    expect(cookie).toContain('Secure')
  })

  it('reads and clears the browser connection cookie', () => {
    const headers = new Headers({
      cookie: `other=value; ${APPLE_MUSIC_CONNECTION_COOKIE}=connection-key`,
    })

    expect(getAppleMusicConnectionKey(headers)).toBe('connection-key')
    expect(clearAppleMusicConnectionCookie()).toContain('Max-Age=0')
  })

  it('omits Secure for the local HTTP development server', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(createAppleMusicConnectionCookie('connection-key')).not.toContain(
      'Secure',
    )
  })

  it('hashes connection keys without retaining their raw value', () => {
    expect(hashAppleMusicConnectionKey('connection-key')).not.toContain(
      'connection-key',
    )
  })
})
