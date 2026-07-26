// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => {
  vi.useRealTimers()
})

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
    expect(result.current.isReviewComplete).toBe(true)
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

  it('auto-advances to the next track that still needs review after a save', async () => {
    vi.useFakeTimers()
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
    provider.select = vi.fn().mockImplementation(async (selectedTrack) => {
      provider.matches = [
        ...provider.matches,
        createResolvedMatch(selectedTrack.id ?? ''),
      ]
    })
    const { result, rerender } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    await act(() => result.current.selectCandidate(candidate))
    act(() => rerender())
    await act(() => vi.advanceTimersByTimeAsync(500))

    expect(provider.select).toHaveBeenCalledWith(playlist.tracks[0], candidate)
    expect(result.current.isOpen).toBe(true)
    expect(result.current.track?.id).toBe('track-2')
    expect(result.current.unresolvedCount).toBe(2)
    expect(result.current.nextLabel).toBe('Review later')
  })

  it('confirms a proposed low-confidence match as a resolved selection', async () => {
    const provider = createProvider()
    provider.matches = [createLowConfidenceMatch('track-1')]
    provider.select = vi.fn().mockImplementation(async (selectedTrack) => {
      provider.matches = [
        createResolvedMatch(selectedTrack.id ?? ''),
        ...provider.matches.filter(
          (match) => match.playlistTrackId !== selectedTrack.id,
        ),
      ]
    })
    const { result, rerender } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    await act(() => result.current.confirmCurrentMatch())
    act(() => rerender())

    expect(provider.select).toHaveBeenCalledWith(
      playlist.tracks[0],
      expect.objectContaining({
        provider: 'SPOTIFY',
        providerTrackId: 'proposed-spotify-track-id',
      }),
    )
    expect(result.current.unresolvedCount).toBe(2)
    expect(result.current.matchedCount).toBe(1)
  })

  it('shows completion after the final unresolved track is skipped', async () => {
    vi.useFakeTimers()
    const provider = createProvider()
    provider.matches = [
      createResolvedMatch('track-2'),
      createResolvedMatch('track-3', 'SKIPPED'),
    ]
    provider.skip = vi.fn().mockImplementation(async (selectedTrack) => {
      provider.matches = [
        ...provider.matches,
        createResolvedMatch(selectedTrack.id ?? '', 'SKIPPED'),
      ]
    })
    const { result, rerender } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    await act(() => result.current.skip())
    act(() => rerender())

    expect(result.current.isReviewComplete).toBe(true)
    expect(result.current.unresolvedCount).toBe(0)
    expect(result.current.matchedCount).toBe(1)
    expect(result.current.skippedCount).toBe(2)

    await act(() => vi.advanceTimersByTimeAsync(500))

    expect(result.current.track).toBeNull()
  })

  it('shows completion after resolving the final track outside the review filter', async () => {
    const provider = createProvider()
    provider.matches = [
      createResolvedMatch('track-2'),
      createResolvedMatch('track-3', 'SKIPPED'),
    ]
    provider.skip = vi.fn().mockImplementation(async (selectedTrack) => {
      provider.matches = [
        ...provider.matches,
        createResolvedMatch(selectedTrack.id ?? '', 'SKIPPED'),
      ]
    })
    const { result, rerender } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.setFilter('all'))
    await act(() => result.current.skip())
    act(() => rerender())

    expect(result.current.filter).toBe('all')
    expect(result.current.isReviewComplete).toBe(true)
    expect(result.current.unresolvedCount).toBe(0)
  })

  it('keeps the current track available when a save fails and retries it', async () => {
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
    provider.select = vi
      .fn()
      .mockRejectedValueOnce(new Error('Spotify save failed.'))
      .mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))
    act(() => result.current.setFilter('all'))

    let saveError: unknown
    await act(async () => {
      try {
        await result.current.selectCandidate(candidate)
      } catch (error) {
        saveError = error
      }
    })

    expect(saveError).toEqual(new Error('Spotify save failed.'))
    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.saveStatus).toBe('error')
    expect(result.current.saveErrorMessage).toBe('Spotify save failed.')

    await act(() => result.current.retrySave())

    expect(provider.select).toHaveBeenCalledTimes(2)
    expect(result.current.saveStatus).toBe('saved')
  })

  it('surfaces provider search errors without clearing the current track', async () => {
    const provider = createProvider()
    provider.search = vi
      .fn()
      .mockRejectedValue(new Error('Search unavailable.'))
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openManager('SPOTIFY'))

    let searchError: unknown
    await act(async () => {
      try {
        await result.current.search('First unresolved')
      } catch (error) {
        searchError = error
      }
    })

    expect(searchError).toEqual(new Error('Search unavailable.'))
    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.searchErrorMessage).toBe('Search unavailable.')
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
    expect(result.current.nextLabel).toBe('Review later')
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

function createLowConfidenceMatch(playlistTrackId: string) {
  return {
    ...createResolvedMatch(playlistTrackId),
    status: 'LOW_CONFIDENCE' as const,
    providerTrackId: 'proposed-spotify-track-id',
    trackName: 'Proposed recording',
    matchConfidenceScore: 62,
  }
}
