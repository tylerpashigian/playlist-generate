// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useStreamingTrackReview } from './use-streaming-track-review'
import type { SavedPlaylist } from '@/models/playlists/models'
import type { StreamingTrackReviewProvider } from './use-streaming-track-review'

const playlist: SavedPlaylist = {
  id: 'playlist-id',
  artist: {
    mbid: 'artist-id',
    name: 'Artist',
    sortName: null,
    disambiguation: null,
    setlistfmUrl: null,
  },
  status: 'DRAFT',
  name: 'Artist recent setlist',
  description: null,
  scoringVersion: 'weighted-recency-v1',
  recentSetlistCount: 10,
  generatedAt: new Date('2026-07-01T00:00:00.000Z'),
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  trackCount: 3,
  tracks: [
    createTrack('track-1', 1, 'First unresolved'),
    createTrack('track-2', 2, 'Already matched'),
    createTrack('track-3', 3, 'Skipped track'),
  ],
}

describe('useStreamingTrackReview', () => {
  it('opens on the first unresolved track and defaults to the review filter', () => {
    const provider = createProvider()
    provider.matches = [
      createResolvedMatch('track-2'),
      createResolvedMatch('track-3', 'SKIPPED'),
    ]
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))

    expect(result.current.isOpen).toBe(true)
    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.filter).toBe('review')
    expect(result.current.trackRows.map((row) => row.track.id)).toEqual([
      'track-1',
    ])
    expect(result.current.mobileView).toBe('match')
  })

  it('falls back to all tracks when every track has a final decision', () => {
    const provider = createProvider()
    provider.matches = [
      createResolvedMatch('track-1'),
      createResolvedMatch('track-2'),
      createResolvedMatch('track-3', 'SKIPPED'),
    ]
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))

    expect(result.current.filter).toBe('all')
    expect(result.current.trackRows).toHaveLength(3)
    expect(result.current.track?.id).toBe('track-1')
  })

  it('filters and searches canonical and provider track metadata', () => {
    const provider = createProvider()
    provider.matches = [
      createResolvedMatch('track-1'),
      {
        ...createResolvedMatch('track-2'),
        trackName: 'Different recording',
        albumName: 'Special album',
      },
      createResolvedMatch('track-3', 'SKIPPED'),
    ]
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.setFilter('matched'))
    act(() => result.current.setTrackQuery('special'))

    expect(result.current.trackRows.map((row) => row.track.id)).toEqual([
      'track-2',
    ])
    expect(result.current.track?.id).toBe('track-2')
  })

  it('selects any visible track and switches the mobile workspace to Match', () => {
    const provider = createProvider()
    provider.matches = playlist.tracks.map((track) =>
      createResolvedMatch(track.id ?? ''),
    )
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.setMobileView('tracks'))
    act(() => result.current.selectTrack('track-3'))

    expect(result.current.track?.id).toBe('track-3')
    expect(result.current.mobileView).toBe('match')
    expect(provider.clearCandidates).toHaveBeenCalledTimes(2)
  })

  it('keeps the manager open after manual selection and skip decisions', async () => {
    const provider = createProvider()
    const candidate = {
      provider: 'SPOTIFY' as const,
      providerTrackId: 'spotify-track-id',
      externalUrl: null,
      title: 'Selected track',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 180000,
    }
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    await act(() => result.current.selectCandidate(candidate))
    await act(() => result.current.skip())

    expect(provider.select).toHaveBeenCalledWith(playlist.tracks[0], candidate)
    expect(provider.skip).toHaveBeenCalledWith(playlist.tracks[0])
    expect(result.current.isOpen).toBe(true)
    expect(result.current.track?.id).toBe('track-1')
  })

  it('retains review content while the dialog closes', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.closeReview())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.selectedProvider).toBe('SPOTIFY')
  })

  it('clears candidates when the selected provider is reapplied', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.selectProvider('SPOTIFY'))

    expect(result.current.selectedProvider).toBe('SPOTIFY')
    expect(provider.clearCandidates).toHaveBeenCalledTimes(2)
  })

  it('advances within the active provider filter', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.nextTrack())

    expect(result.current.track?.id).toBe('track-2')
    expect(result.current.nextLabel).toBe('Next unresolved')
  })
})

function createProvider(): StreamingTrackReviewProvider {
  return {
    provider: 'SPOTIFY',
    label: 'Spotify',
    matches: [],
    candidates: [],
    isSearching: false,
    isSaving: false,
    search: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue(undefined),
    skip: vi.fn().mockResolvedValue(undefined),
    clearCandidates: vi.fn(),
  }
}

function createTrack(id: string, position: number, title: string) {
  return {
    id,
    position,
    title,
    normalizedTitle: title.toLowerCase(),
    isIncluded: true,
    isCover: false,
    originalArtistName: null,
    originalArtistMbid: null,
    confidenceScore: 100,
    weightedScore: 100,
    appearanceCount: 10,
    totalSetlistsConsidered: 10,
    lastPlayedAt: new Date('2026-07-01T00:00:00.000Z'),
    evidence: { setlistfmIds: [], playedAt: [] },
  }
}

function createResolvedMatch(
  playlistTrackId: string,
  status: 'MANUALLY_MATCHED' | 'SKIPPED' = 'MANUALLY_MATCHED',
) {
  return {
    playlistTrackId,
    provider: 'SPOTIFY' as const,
    status,
    providerTrackId: status === 'SKIPPED' ? null : 'spotify-track-id',
    providerTrackUri: status === 'SKIPPED' ? null : 'spotify:track:123',
    externalUrl: null,
    trackName: status === 'SKIPPED' ? null : 'Selected track',
    artistName: status === 'SKIPPED' ? null : 'Artist',
    albumName: status === 'SKIPPED' ? null : 'Album',
    durationMs: status === 'SKIPPED' ? null : 180000,
    matchConfidenceScore: null,
  }
}
