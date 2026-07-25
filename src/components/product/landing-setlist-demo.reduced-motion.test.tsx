// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingSetlistDemo } from './landing-setlist-demo'
import type * as MotionReact from 'motion/react'

vi.mock('motion/react', async (importOriginal) => {
  const motion = await importOriginal<typeof MotionReact>()

  return {
    ...motion,
    useReducedMotion: () => true,
  }
})

afterEach(() => {
  cleanup()
})

describe('LandingSetlistDemo with reduced motion', () => {
  it('reveals the ranked state immediately', () => {
    render(<LandingSetlistDemo />)

    fireEvent.click(screen.getByRole('button', { name: 'Reveal likely set' }))

    expect(screen.getByText('Confidence ranked')).toBeTruthy()
    expect(screen.getByText('Innerbloom')).toBeTruthy()
  })
})
