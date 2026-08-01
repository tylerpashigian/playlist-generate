import { describe, expect, it } from 'vitest'
import { ExternalProviderError, ExternalProviderRateLimitError } from '@/server/errors'
import { getProviderResponseError } from './provider-errors'

describe('getProviderResponseError', () => {
  it('preserves a numeric Retry-After value for a provider 429', () => {
    const error = getProviderResponseError(
      'Spotify',
      new Response(null, {
        status: 429,
        headers: { 'retry-after': '12' },
      }),
    )

    expect(error).toBeInstanceOf(ExternalProviderRateLimitError)
    expect(error).toMatchObject({
      provider: 'Spotify',
      retryAfterSeconds: 12,
    })
  })

  it('uses generic retry guidance when a provider omits Retry-After', () => {
    const error = getProviderResponseError(
      'Apple Music',
      new Response(null, { status: 429 }),
    )

    expect(error).toBeInstanceOf(ExternalProviderRateLimitError)
    expect(error.message).toBe(
      'Apple Music is temporarily rate limited. Try again shortly.',
    )
  })

  it('keeps non-rate-limit provider failures unchanged', () => {
    const error = getProviderResponseError(
      'Spotify',
      new Response(null, { status: 503 }),
    )

    expect(error).toBeInstanceOf(ExternalProviderError)
    expect(error).not.toBeInstanceOf(ExternalProviderRateLimitError)
    expect(error).toMatchObject({ provider: 'Spotify', status: 503 })
  })
})
