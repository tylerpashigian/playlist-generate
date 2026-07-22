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
  trackCount: 2,
  tracks: [createTrack('track-1', 1), createTrack('track-2', 2)],
}

describe('useStreamingTrackReview', () => {
  it('auto-selects the only provider for a generic track review', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openTrack(playlist.tracks[0]))

    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.selectedProvider).toBe('SPOTIFY')
    expect(result.current.isProviderLocked).toBe(false)
    expect(provider.clearCandidates).toHaveBeenCalledOnce()
  })

  it('locks provider review opened from an export group', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openFirstUnresolved('SPOTIFY'))

    expect(result.current.track?.id).toBe('track-1')
    expect(result.current.selectedProvider).toBe('SPOTIFY')
    expect(result.current.isProviderLocked).toBe(true)
  })

  it('clears provider candidates when the generic provider selection changes', () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openTrack(playlist.tracks[0]))
    act(() => result.current.selectProvider(null))

    expect(result.current.selectedProvider).toBeNull()
    expect(provider.clearCandidates).toHaveBeenCalledTimes(2)
  })

  it('dispatches provider callbacks and advances within provider state', async () => {
    const provider = createProvider()
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openFirstUnresolved('SPOTIFY'))
    await act(() => result.current.search('track'))
    act(() => result.current.nextUnresolved())

    expect(provider.search).toHaveBeenCalledWith(playlist.tracks[0], 'track')
    expect(result.current.track?.id).toBe('track-2')
    expect(result.current.selectedProvider).toBe('SPOTIFY')
    expect(result.current.isProviderLocked).toBe(true)
  })

  it('keeps review open after selection and advances explicitly', async () => {
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
    provider.select = vi.fn().mockImplementation(async (track) => {
      provider.matches = [createResolvedMatch(track.id ?? '')]
    })
    const { result } = renderHook(() =>
      useStreamingTrackReview({ playlist, providers: [provider] }),
    )

    act(() => result.current.openFirstUnresolved('SPOTIFY'))
    await act(() => result.current.selectCandidate(candidate))

    expect(provider.select).toHaveBeenCalledWith(playlist.tracks[0], candidate)
    expect(result.current.track?.id).toBe('track-1')

    act(() => result.current.nextUnresolved())

    expect(result.current.track?.id).toBe('track-2')
  })

  it('keeps review open after skip and closes when review is complete', async () => {
    const oneTrackPlaylist = { ...playlist, tracks: [playlist.tracks[0]] }
    const provider = createProvider()
    provider.skip = vi.fn().mockImplementation(async (track) => {
      provider.matches = [createResolvedMatch(track.id ?? '', 'SKIPPED')]
    })
    const { result } = renderHook(() =>
      useStreamingTrackReview({
        playlist: oneTrackPlaylist,
        providers: [provider],
      }),
    )

    act(() => result.current.openFirstUnresolved('SPOTIFY'))
    await act(() => result.current.skip())

    expect(result.current.track?.id).toBe('track-1')

    act(() => result.current.nextUnresolved())

    expect(result.current.track).toBeNull()
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

function createTrack(id: string, position: number) {
  return {
    id,
    position,
    title: `Track ${position}`,
    normalizedTitle: `track ${position}`,
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
