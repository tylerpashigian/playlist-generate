import { describe, expect, it } from 'vitest'
import { parseAppleMusicAllowedOrigins } from './developer-token'

describe('parseAppleMusicAllowedOrigins', () => {
  const betterAuthUrl = 'https://playencore.app'

  it('returns exact, de-duplicated configured origins', () => {
    expect(
      parseAppleMusicAllowedOrigins({
        configuredOrigins:
          'https://dev.playencore.app,https://playencore.app,https://playencore.app',
        betterAuthUrl,
        isProduction: true,
      }),
    ).toEqual(['https://dev.playencore.app', 'https://playencore.app'])
  })

  it('allows an unbound local-development token', () => {
    expect(
      parseAppleMusicAllowedOrigins({
        configuredOrigins: undefined,
        betterAuthUrl: 'http://127.0.0.1:3000',
        isProduction: false,
      }),
    ).toEqual([])
  })

  it('rejects production without an origin allowlist', () => {
    expect(() =>
      parseAppleMusicAllowedOrigins({
        configuredOrigins: undefined,
        betterAuthUrl,
        isProduction: true,
      }),
    ).toThrow('APPLE_MUSIC_ALLOWED_ORIGINS must be configured in production.')
  })

  it('rejects origins that do not include the configured app origin', () => {
    expect(() =>
      parseAppleMusicAllowedOrigins({
        configuredOrigins: 'https://dev.playencore.app',
        betterAuthUrl,
        isProduction: true,
      }),
    ).toThrow('APPLE_MUSIC_ALLOWED_ORIGINS must include the BETTER_AUTH_URL origin.')
  })
})
