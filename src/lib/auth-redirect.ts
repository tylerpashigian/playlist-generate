const DEFAULT_AUTH_REDIRECT = '/app'

export function sanitizeAuthRedirect(
  redirect: unknown,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  const safeFallback = normalizeAppPath(fallback) ?? DEFAULT_AUTH_REDIRECT

  if (typeof redirect !== 'string') {
    return safeFallback
  }

  return normalizeAppPath(redirect) ?? safeFallback
}

function normalizeAppPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  if (
    value === '/auth' ||
    value.startsWith('/auth?') ||
    value.startsWith('/auth#')
  ) {
    return null
  }

  return value
}
