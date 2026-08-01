import { describe, expect, it } from 'vitest'
import { hasTrustedTrpcRequestOrigin } from './trpc-origin'

function request({ method = 'POST', origin }: { method?: string; origin?: string }) {
  return new Request('https://playencore.app/api/trpc/playlists.save', {
    headers: origin ? { origin } : undefined,
    method,
  })
}

describe('hasTrustedTrpcRequestOrigin', () => {
  const appUrl = 'https://playencore.app'

  it('allows POST requests from the configured application origin', () => {
    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl,
        isProduction: true,
        request: request({ origin: appUrl }),
      }),
    ).toBe(true)
  })

  it('rejects a POST without an Origin header', () => {
    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl,
        isProduction: true,
        request: request({}),
      }),
    ).toBe(false)
  })

  it('rejects POST requests initiated by another origin', () => {
    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl,
        isProduction: true,
        request: request({ origin: 'https://malicious.example' }),
      }),
    ).toBe(false)
  })

  it('allows tRPC GET queries without an Origin header', () => {
    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl,
        isProduction: true,
        request: request({ method: 'GET' }),
      }),
    ).toBe(true)
  })

  it('allows the localhost and loopback aliases only during development', () => {
    const localRequest = request({ origin: 'http://127.0.0.1:3000' })

    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl: 'http://localhost:3000',
        isProduction: false,
        request: localRequest,
      }),
    ).toBe(true)
    expect(
      hasTrustedTrpcRequestOrigin({
        appUrl: 'http://localhost:3000',
        isProduction: true,
        request: localRequest,
      }),
    ).toBe(false)
  })
})
