type TrpcOriginGuardOptions = {
  appUrl: string
  isProduction: boolean
  request: Request
}

function isLocalDevelopmentOrigin(origin: URL, appOrigin: URL) {
  return (
    !origin.username &&
    !origin.password &&
    origin.protocol === 'http:' &&
    origin.port === appOrigin.port &&
    (origin.hostname === 'localhost' || origin.hostname === '127.0.0.1')
  )
}

/**
 * Browser POST requests carry an Origin header. Requiring it to match Encore's
 * own origin prevents another website from using a user's cookie session to
 * invoke tRPC mutations (CSRF).
 */
export function hasTrustedTrpcRequestOrigin({
  appUrl,
  isProduction,
  request,
}: TrpcOriginGuardOptions) {
  if (request.method !== 'POST') {
    return true
  }

  const requestOrigin = request.headers.get('origin')
  if (!requestOrigin) {
    return false
  }

  try {
    const origin = new URL(requestOrigin)
    const appOrigin = new URL(appUrl)

    if (origin.origin === appOrigin.origin) {
      return true
    }

    return !isProduction && isLocalDevelopmentOrigin(origin, appOrigin)
  } catch {
    return false
  }
}
