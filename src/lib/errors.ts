export function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Something went wrong'
}

export function hasErrorCode(error: unknown, code: string) {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return false
  }

  const { data } = error

  if (data === null || typeof data !== 'object' || !('code' in data)) {
    return false
  }

  return data.code === code
}
