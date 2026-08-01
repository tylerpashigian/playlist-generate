import { describe, expect, it } from 'vitest'
import { ExternalProviderRateLimitError } from '@/server/errors'
import { toTRPCError } from './errors'

describe('toTRPCError', () => {
  it('maps provider rate limits to an HTTP 429 tRPC error', () => {
    const error = toTRPCError(new ExternalProviderRateLimitError('Spotify', 8))

    expect(error.code).toBe('TOO_MANY_REQUESTS')
    expect(error.message).toBe(
      'Spotify is temporarily rate limited. Try again in 8 seconds.',
    )
  })
})
