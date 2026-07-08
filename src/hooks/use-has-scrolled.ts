import { useEffect, useState } from 'react'

export function useHasScrolled(threshold = 8) {
  const [hasScrolled, setHasScrolled] = useState(false)

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
