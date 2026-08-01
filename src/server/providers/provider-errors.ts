import {
  ExternalProviderError,
  ExternalProviderRateLimitError,
} from '@/server/errors'

function getRetryAfterSeconds(value: string | null) {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds)
  }

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) return null

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

export function getProviderResponseError(provider: string, response: Response) {
  if (response.status === 429) {
    return new ExternalProviderRateLimitError(
      provider,
      getRetryAfterSeconds(response.headers.get('retry-after')),
    )
  }

  return new ExternalProviderError(provider, response.status)
}
