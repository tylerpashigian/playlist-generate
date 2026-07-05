import { useEffect, useState } from 'react'

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof breakpoints
type BreakpointValueMap<T> = Partial<Record<Breakpoint, T>> & { base: T }

export function useBreakpointValue<const T>(values: BreakpointValueMap<T>) {
  const [value, setValue] = useState(() => getBreakpointValue(values))

  useEffect(() => {
    function handleResize() {
      setValue(getBreakpointValue(values))
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [values])

  return value
}

function getBreakpointValue<T>(values: BreakpointValueMap<T>) {
  if (typeof window === 'undefined') {
    return values.base
  }

  let value = values.base

  for (const breakpoint of Object.keys(breakpoints) as Array<Breakpoint>) {
    if (
      window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`).matches &&
      breakpoint in values
    ) {
      value = values[breakpoint] as T
    }
  }

  return value
}
