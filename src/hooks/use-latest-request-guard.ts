import { useCallback, useMemo, useRef } from 'react'

export function useLatestRequestGuard() {
  const versionRef = useRef(0)

  const begin = useCallback(() => {
    versionRef.current += 1
    return versionRef.current
  }, [])

  const isCurrent = useCallback(
    (version: number) => version === versionRef.current,
    [],
  )

  const invalidate = useCallback(() => {
    versionRef.current += 1
  }, [])

  return useMemo(
    () => ({ begin, isCurrent, invalidate }),
    [begin, invalidate, isCurrent],
  )
}
