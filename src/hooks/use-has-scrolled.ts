import { useEffect, useState } from 'react'

export function useHasScrolled(threshold = 8) {
  const [hasScrolled, setHasScrolled] = useState(() =>
    getInitialScrolledState(threshold),
  )

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > threshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return hasScrolled
}

function getInitialScrolledState(threshold: number) {
  if (typeof window === 'undefined') {
    return false
  }

  return window.scrollY > threshold
}
