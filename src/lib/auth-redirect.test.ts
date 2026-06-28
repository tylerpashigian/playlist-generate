import { describe, expect, it } from 'vitest'
import { sanitizeAuthRedirect } from './auth-redirect'

describe('sanitizeAuthRedirect', () => {
  it('keeps safe in-app redirect paths', () => {
    expect(sanitizeAuthRedirect('/profile?tab=connections#spotify')).toBe(
      '/profile?tab=connections#spotify',
    )
  })

  it('falls back when the redirect points to auth', () => {
    expect(sanitizeAuthRedirect('/auth')).toBe('/app')
    expect(sanitizeAuthRedirect('/auth?redirect=/auth')).toBe('/app')
    expect(sanitizeAuthRedirect('/auth#sign-in')).toBe('/app')
  })

  it('rejects external redirects', () => {
    expect(sanitizeAuthRedirect('https://example.com/app')).toBe('/app')
    expect(sanitizeAuthRedirect('//example.com/app')).toBe('/app')
  })

  it('rejects non-root-relative redirects', () => {
    expect(sanitizeAuthRedirect('profile')).toBe('/app')
    expect(sanitizeAuthRedirect('')).toBe('/app')
  })
})
