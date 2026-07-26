// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaylistPreview } from './playlist-preview'
import type { PlaylistPreviewTrack } from './playlist-preview'
import type * as MotionReact from 'motion/react'

vi.mock('motion/react', async (importOriginal) => {
  const motion = await importOriginal<typeof MotionReact>()

  return {
    ...motion,
    useReducedMotion: () => true,
  }
})

const track: PlaylistPreviewTrack = {
  key: '1-innerbloom',
  position: 1,
  title: 'Innerbloom',
  detail: 'Original performance',
  evidence: '8/10 setlists',
  confidenceScore: 85,
  confidenceEvidence: {
    weightedScore: 47,
    appearanceCount: 8,
    totalSetlistsConsidered: 10,
    lastPlayedAt: new Date('2026-07-18T00:00:00.000Z'),
    playedAt: ['18-07-2026'],
  },
}

afterEach(() => {
  cleanup()
})

describe('PlaylistPreview confidence evidence with reduced motion', () => {
  it('reveals evidence immediately', () => {
    render(<PlaylistPreview tracks={[track]} showConfidenceEvidence />)

    fireEvent.click(
      screen.getByRole('button', {
        name: '85% confidence. Show evidence for Innerbloom',
      }),
    )

    expect(screen.getByText('47 of 55 possible')).toBeTruthy()
  })
})
