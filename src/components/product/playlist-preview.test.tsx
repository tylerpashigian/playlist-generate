// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PlaylistPreview, trackToPreviewTrack } from './playlist-preview'
import type { PlaylistPreviewTrack } from './playlist-preview'
import type { PlaylistTrack } from '@/models/playlists/models'

const tracks: Array<PlaylistPreviewTrack> = [
  {
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
      playedAt: ['18-07-2026', '16-07-2026', 'unparsed-date'],
    },
  },
  {
    key: '2-surrender',
    position: 2,
    title: 'Surrender',
    detail: 'Original performance',
    evidence: '3/10 setlists',
    confidenceScore: 29,
    confidenceEvidence: {
      weightedScore: 16,
      appearanceCount: 3,
      totalSetlistsConsidered: 10,
      lastPlayedAt: null,
      playedAt: [],
    },
  },
]

afterEach(() => {
  cleanup()
})

describe('PlaylistPreview confidence evidence', () => {
  it('maps canonical track evidence into the preview model', () => {
    const track: PlaylistTrack = {
      position: 1,
      title: 'Innerbloom',
      normalizedTitle: 'innerbloom',
      isIncluded: true,
      isCover: false,
      originalArtistName: null,
      originalArtistMbid: null,
      confidenceScore: 85,
      weightedScore: 47,
      appearanceCount: 8,
      totalSetlistsConsidered: 10,
      lastPlayedAt: new Date('2026-07-18T00:00:00.000Z'),
      evidence: {
        setlistfmIds: ['setlist-1'],
        playedAt: ['18-07-2026'],
      },
    }

    expect(trackToPreviewTrack(track).confidenceEvidence).toEqual({
      weightedScore: 47,
      appearanceCount: 8,
      totalSetlistsConsidered: 10,
      lastPlayedAt: new Date('2026-07-18T00:00:00.000Z'),
      playedAt: ['18-07-2026'],
    })
  })

  it('reveals only track-level evidence and allows comparison across rows', async () => {
    render(<PlaylistPreview tracks={tracks} showConfidenceEvidence />)

    const innerbloomTrigger = screen.getByRole('button', {
      name: '85% confidence. Show evidence for Innerbloom',
    })
    const surrenderTrigger = screen.getByRole('button', {
      name: '29% confidence. Show evidence for Surrender',
    })

    expect(innerbloomTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('47 of 55 possible')).toBeNull()

    fireEvent.click(innerbloomTrigger)

    expect(
      screen.getByRole('button', {
        name: '85% confidence. Hide evidence for Innerbloom',
      }),
    ).toBeTruthy()
    expect(await screen.findByText('47 of 55 possible')).toBeTruthy()
    expect(screen.getByText('8 of 10 setlists')).toBeTruthy()
    expect(screen.getAllByText('Jul 18, 2026')).toHaveLength(2)
    expect(screen.getByText('Jul 16, 2026')).toBeTruthy()
    expect(screen.getByText('unparsed-date')).toBeTruthy()
    expect(screen.getByText(/not a complete tour history/)).toBeTruthy()

    expect(screen.getByText('Recent appearances').className).toContain(
      'text-xs',
    )
    expect(screen.getByText('Jul 16, 2026').className).toContain('text-sm')
    expect(
      screen.getByText(/not a complete tour history/).className,
    ).toContain('text-sm')

    fireEvent.click(surrenderTrigger)

    expect(await screen.findByText('16 of 55 possible')).toBeTruthy()
    expect(screen.getByText('3 of 10 setlists')).toBeTruthy()
    expect(screen.getByText('Not available')).toBeTruthy()
    expect(
      screen.getByText('Appearance dates are not available for this track.'),
    ).toBeTruthy()
    expect(screen.getByText('47 of 55 possible')).toBeTruthy()
  })

  it('keeps the confidence score non-interactive when evidence is disabled', () => {
    render(<PlaylistPreview tracks={tracks} compact />)

    expect(screen.getByText('85%')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /evidence for Innerbloom/ }),
    ).toBeNull()
  })
})
