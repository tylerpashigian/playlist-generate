// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaylistReviewExportSection } from './playlist-review-export-section'
import type { GeneratedPlaylist, SavedPlaylist } from '@/models/playlists/models'

const generatedPlaylist: GeneratedPlaylist = {
  artist: {
    mbid: 'artist-1',
    name: 'Rufus Du Sol',
    sortName: 'Rufus Du Sol',
    disambiguation: null,
    setlistfmUrl: null,
  },
  name: 'Rufus Du Sol recent setlist',
  description: null,
  scoringVersion: 'weighted-recency-v1',
  recentSetlistCount: 6,
  generatedAt: new Date('2026-07-04T00:00:00.000Z'),
  tracks: [
    {
      position: 1,
      title: 'Innerbloom',
      normalizedTitle: 'innerbloom',
      isIncluded: true,
      isCover: false,
      originalArtistName: null,
      originalArtistMbid: null,
      confidenceScore: 100,
      weightedScore: 100,
      appearanceCount: 6,
      totalSetlistsConsidered: 6,
      lastPlayedAt: new Date('2026-07-03T00:00:00.000Z'),
      evidence: {
        setlistfmIds: ['setlist-1'],
        playedAt: ['2026-07-03'],
      },
    },
  ],
}

const savedPlaylist: SavedPlaylist = {
  ...generatedPlaylist,
  id: 'playlist-1',
  status: 'DRAFT',
  createdAt: new Date('2026-07-04T00:00:00.000Z'),
  updatedAt: new Date('2026-07-04T00:00:00.000Z'),
  trackCount: generatedPlaylist.tracks.length,
}

afterEach(() => {
  cleanup()
})

describe('PlaylistReviewExportSection', () => {
  it('renders playlist review content, export content, and caller-owned actions', () => {
    const onAction = vi.fn()

    render(
      <PlaylistReviewExportSection
        review={{
          playlist: generatedPlaylist,
          title: 'Generated playlist',
          subtitle: '1 track · 6 setlists',
          actions: (
            <button type="button" onClick={onAction}>
              Save draft
            </button>
          ),
        }}
        exports={{
          groups: [
            {
              provider: 'SPOTIFY',
              selectedPlaylist: null,
              matches: [],
              exportResult: null,
              isMatching: false,
              isExporting: false,
              errorMessage: null,
              onMatchTracks: vi.fn(),
              onExport: vi.fn(),
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Generated playlist')).toBeTruthy()
    expect(screen.getByText('1 track · 6 setlists')).toBeTruthy()
    expect(screen.getByText('Innerbloom')).toBeTruthy()
    expect(screen.getByText('Streaming exports')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('renders the empty state without requiring a playlist', () => {
    render(
      <PlaylistReviewExportSection
        review={{
          playlist: null,
          title: 'Generated playlist',
          subtitle: '',
          emptyTitle: 'Find an artist',
          emptyMessage: 'Select an artist first.',
        }}
        exports={{
          groups: [
            {
              provider: 'SPOTIFY',
              selectedPlaylist: null,
              matches: [],
              exportResult: null,
              isMatching: false,
              isExporting: false,
              errorMessage: null,
              onMatchTracks: vi.fn(),
              onExport: vi.fn(),
            },
          ],
        }}
      />,
    )

    expect(screen.queryByText('Generated playlist')).toBeNull()
    expect(screen.getByText('Find an artist')).toBeTruthy()
    expect(screen.getByText('Select an artist first.')).toBeTruthy()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('calls the provided match and export callbacks from the standard export controls', () => {
    const onMatchTracks = vi.fn()
    const onExport = vi.fn()

    render(
      <PlaylistReviewExportSection
        review={{
          playlist: generatedPlaylist,
          title: 'Generated playlist',
          subtitle: '1 track · 6 setlists',
        }}
        exports={{
          groups: [
            {
              provider: 'SPOTIFY',
              selectedPlaylist: savedPlaylist,
              matches: [],
              exportResult: null,
              isMatching: false,
              isExporting: false,
              errorMessage: null,
              onMatchTracks,
              onExport,
            },
          ],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Match tracks' }))
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Export' })
        .disabled,
    ).toBe(true)

    expect(onMatchTracks).toHaveBeenCalledOnce()
    expect(onExport).not.toHaveBeenCalled()
  })
})
