// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useArtist } from './use-artist'
import { useDebouncedValue } from './use-debounced-value'
import { useGeneratedPlaylist } from './use-generated-playlist'
import { useLatestRequestGuard } from './use-latest-request-guard'
import { useSavedPlaylists } from './use-saved-playlists'
import { useSpotify } from './use-spotify'
import { useStreamingConnections } from './use-streaming-connections'
import type { ReactNode } from 'react'
import type { Artist } from '@/models/artists/models'
import type { GeneratedPlaylist } from '@/models/playlists/models'
import type {
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'
import { spotifyPlaylistExportScopes } from '@/lib/spotify-scopes'

const serviceMocks = vi.hoisted(() => ({
  searchArtists: vi.fn(),
  generatePlaylist: vi.fn(),
  saveGeneratedPlaylist: vi.fn(),
  deleteSavedPlaylist: vi.fn(),
  refreshSavedPlaylist: vi.fn(),
  listSavedPlaylists: vi.fn(),
  getSavedPlaylist: vi.fn(),
  listStreamingConnections: vi.fn(),
  disconnectStreamingProvider: vi.fn(),
  matchPlaylistTracks: vi.fn(),
  getSpotifyTrackMatches: vi.fn(),
  searchSpotifyTrackCandidates: vi.fn(),
  selectSpotifyTrack: vi.fn(),
  skipSpotifyTrack: vi.fn(),
  exportPlaylistToSpotify: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  linkSocial: vi.fn(),
  signInSocial: vi.fn(),
}))

const notificationMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(<T,>(promise: Promise<T>) => promise),
}))

vi.mock('@/services/artists', () => ({
  searchArtists: serviceMocks.searchArtists,
}))

vi.mock('@/services/playlists', () => ({
  generatePlaylist: serviceMocks.generatePlaylist,
  saveGeneratedPlaylist: serviceMocks.saveGeneratedPlaylist,
  deleteSavedPlaylist: serviceMocks.deleteSavedPlaylist,
  refreshSavedPlaylist: serviceMocks.refreshSavedPlaylist,
  listSavedPlaylists: serviceMocks.listSavedPlaylists,
  getSavedPlaylist: serviceMocks.getSavedPlaylist,
}))

vi.mock('@/services/streaming', () => ({
  listStreamingConnections: serviceMocks.listStreamingConnections,
  disconnectStreamingProvider: serviceMocks.disconnectStreamingProvider,
}))

vi.mock('@/services/spotify', () => ({
  matchPlaylistTracks: serviceMocks.matchPlaylistTracks,
  getSpotifyTrackMatches: serviceMocks.getSpotifyTrackMatches,
  searchSpotifyTrackCandidates: serviceMocks.searchSpotifyTrackCandidates,
  selectSpotifyTrack: serviceMocks.selectSpotifyTrack,
  skipSpotifyTrack: serviceMocks.skipSpotifyTrack,
  exportPlaylistToSpotify: serviceMocks.exportPlaylistToSpotify,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    linkSocial: authMocks.linkSocial,
    signIn: {
      social: authMocks.signInSocial,
    },
  },
}))

vi.mock('@/lib/toast', () => ({
  toast: notificationMocks,
}))

const artist: Artist = {
  mbid: 'artist-mbid',
  name: 'Artist',
  sortName: null,
  disambiguation: null,
  setlistfmUrl: null,
}

const generatedPlaylist: GeneratedPlaylist = {
  artist,
  name: 'Artist recent setlist',
  description: null,
  scoringVersion: 'recent-weighted-v1',
  recentSetlistCount: 1,
  generatedAt: new Date('2026-06-01T12:00:00.000Z'),
  tracks: [],
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

function createWrapper({
  queryRetry = false,
}: {
  queryRetry?: boolean
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: queryRetry },
      mutations: { retry: false },
    },
  })

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('playlist workflow hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceMocks.listSavedPlaylists.mockResolvedValue([])
    serviceMocks.getSavedPlaylist.mockResolvedValue(null)
    serviceMocks.listStreamingConnections.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces values before publishing changes', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: 'initial' },
      },
    )

    rerender({ value: 'updated' })

    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe('updated')
  })

  it('invalidates older request versions', () => {
    const { result } = renderHook(() => useLatestRequestGuard())
    let firstVersion = 0
    let secondVersion = 0

    act(() => {
      firstVersion = result.current.begin()
      secondVersion = result.current.begin()
    })

    expect(result.current.isCurrent(firstVersion)).toBe(false)
    expect(result.current.isCurrent(secondVersion)).toBe(true)

    act(() => result.current.invalidate())

    expect(result.current.isCurrent(secondVersion)).toBe(false)
  })

  it('searches artists through the artist service', async () => {
    serviceMocks.searchArtists.mockResolvedValue([artist])
    const { result } = renderHook(() => useArtist(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.setQuery('artist')
      await result.current.search('artist')
    })

    expect(serviceMocks.searchArtists).toHaveBeenCalledWith('artist')
    expect(result.current.artists).toEqual([artist])
    expect(result.current.isLoading).toBe(false)
  })

  it('debounces artist searches while the input updates immediately', async () => {
    vi.useFakeTimers()
    serviceMocks.searchArtists.mockResolvedValue([artist])
    const { result } = renderHook(() => useArtist(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('artist')
    })

    expect(result.current.query).toBe('artist')
    expect(serviceMocks.searchArtists).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(serviceMocks.searchArtists).toHaveBeenCalledWith('artist')
    expect(result.current.artists).toEqual([artist])
  })

  it('does not let an older artist search overwrite newer results', async () => {
    vi.useFakeTimers()
    const olderSearch = createDeferred<Array<Artist>>()
    const newerSearch = createDeferred<Array<Artist>>()
    const newerArtist: Artist = { ...artist, mbid: 'newer-artist-mbid' }
    serviceMocks.searchArtists
      .mockReturnValueOnce(olderSearch.promise)
      .mockReturnValueOnce(newerSearch.promise)
    const { result } = renderHook(() => useArtist(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('morgan')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    act(() => {
      result.current.setQuery('morgan walle')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    await act(async () => {
      newerSearch.resolve([newerArtist])
      await Promise.resolve()
    })

    expect(result.current.artists).toEqual([newerArtist])

    await act(async () => {
      olderSearch.resolve([artist])
      await Promise.resolve()
    })

    expect(result.current.artists).toEqual([newerArtist])
  })

  it('does not auto-search artist queries shorter than two characters', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useArtist(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('a')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(serviceMocks.searchArtists).not.toHaveBeenCalled()
    expect(result.current.artists).toEqual([])
  })

  it('clears artist results and selection when the query is cleared', async () => {
    vi.useFakeTimers()
    serviceMocks.searchArtists.mockResolvedValue([artist])
    const { result } = renderHook(() => useArtist(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setQuery('artist')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.artists).toEqual([artist])

    act(() => {
      result.current.setSelectedArtist(artist)
      result.current.setQuery('')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.artists).toEqual([])
    expect(result.current.selectedArtist).toBeNull()
  })

  it('generates playlists through the playlist service', async () => {
    serviceMocks.generatePlaylist.mockResolvedValue(generatedPlaylist)
    const { result } = renderHook(() => useGeneratedPlaylist(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.generate(artist)
    })

    expect(serviceMocks.generatePlaylist).toHaveBeenCalledWith(artist)
    expect(result.current.playlist).toEqual(generatedPlaylist)
  })

  it('updates generated track inclusion before saving', async () => {
    const playlistWithTrack: GeneratedPlaylist = {
      ...generatedPlaylist,
      tracks: [
        {
          position: 1,
          title: 'Track',
          normalizedTitle: 'track',
          isIncluded: true,
          isCover: false,
          originalArtistName: null,
          originalArtistMbid: null,
          confidenceScore: 100,
          weightedScore: 10,
          appearanceCount: 1,
          totalSetlistsConsidered: 1,
          lastPlayedAt: null,
          evidence: { setlistfmIds: [], playedAt: [] },
        },
      ],
    }
    serviceMocks.generatePlaylist.mockResolvedValue(playlistWithTrack)
    const { result } = renderHook(() => useGeneratedPlaylist(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.generate(artist)
    })
    act(() => {
      result.current.setTrackIncluded(1, false)
    })

    expect(result.current.playlist?.tracks[0]?.isIncluded).toBe(false)
  })

  it('clears the generated playlist when the artist query is cleared', async () => {
    serviceMocks.generatePlaylist.mockResolvedValue(generatedPlaylist)
    const { result } = renderHook(
      () => {
        const artistSearch = useArtist()
        const generated = useGeneratedPlaylist()

        function setArtistQuery(query: string) {
          artistSearch.setQuery(query)

          if (!query.trim()) {
            generated.reset()
          }
        }

        async function generate(generatedArtist: Artist) {
          artistSearch.selectArtist(generatedArtist)
          await generated.generate(generatedArtist)
        }

        return {
          artistSearch,
          generated,
          setArtistQuery,
          generate,
        }
      },
      {
        wrapper: createWrapper(),
      },
    )

    await act(async () => {
      await result.current.generate(artist)
    })

    expect(result.current.generated.playlist).toEqual(generatedPlaylist)
    expect(result.current.artistSearch.selectedArtist).toEqual(artist)

    act(() => {
      result.current.setArtistQuery('')
    })

    expect(result.current.generated.playlist).toBeNull()
    expect(result.current.artistSearch.selectedArtist).toBeNull()
  })

  it('saves playlists and refreshes saved playlist state', async () => {
    serviceMocks.saveGeneratedPlaylist.mockResolvedValue({
      ...generatedPlaylist,
      id: 'playlist-id',
      status: 'DRAFT',
      createdAt: generatedPlaylist.generatedAt,
      updatedAt: generatedPlaylist.generatedAt,
      trackCount: 0,
    })
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.save(generatedPlaylist)
    })

    expect(serviceMocks.saveGeneratedPlaylist).toHaveBeenCalledWith(
      generatedPlaylist,
      { mode: 'create' },
    )
    expect(result.current.selectedPlaylistId).toBe('playlist-id')
    expect(notificationMocks.success).toHaveBeenCalledWith(
      'Artist recent setlist saved',
    )
  })

  it('requires confirmation before replacing an existing artist playlist', async () => {
    const existingPlaylist = {
      ...generatedPlaylist,
      id: 'existing-playlist-id',
      status: 'DRAFT',
      createdAt: generatedPlaylist.generatedAt,
      updatedAt: generatedPlaylist.generatedAt,
      trackCount: 0,
    }
    serviceMocks.listSavedPlaylists.mockResolvedValue([existingPlaylist])
    serviceMocks.saveGeneratedPlaylist.mockResolvedValue(existingPlaylist)
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.playlists).toHaveLength(1)
    })

    await act(async () => {
      await result.current.save(generatedPlaylist)
    })

    expect(serviceMocks.saveGeneratedPlaylist).not.toHaveBeenCalled()
    expect(result.current.needsReplacementConfirmation).toBe(true)
    expect(result.current.existingPlaylistForReplacement?.id).toBe(
      'existing-playlist-id',
    )

    await act(async () => {
      await result.current.replacePendingPlaylist()
    })

    expect(serviceMocks.saveGeneratedPlaylist).toHaveBeenCalledWith(
      generatedPlaylist,
      { mode: 'replace' },
    )
    expect(result.current.needsReplacementConfirmation).toBe(false)
    expect(result.current.selectedPlaylistId).toBe('existing-playlist-id')
  })

  it('shows replacement confirmation when the backend rejects a stale create save', async () => {
    const conflictError = new Error(
      'A saved playlist already exists for this artist.',
    ) as Error & { data: { code: string } }
    conflictError.data = { code: 'CONFLICT' }
    serviceMocks.saveGeneratedPlaylist.mockRejectedValue(conflictError)
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.save(generatedPlaylist)
    })

    expect(result.current.needsReplacementConfirmation).toBe(true)
    expect(notificationMocks.error).not.toHaveBeenCalledWith(
      'Playlist could not be saved',
    )
  })

  it('confirms deletion, clears selection, and removes the cached detail', async () => {
    const savedPlaylist = {
      ...generatedPlaylist,
      id: 'playlist-id',
      status: 'DRAFT' as const,
      createdAt: generatedPlaylist.generatedAt,
      updatedAt: generatedPlaylist.generatedAt,
      trackCount: 0,
    }
    serviceMocks.saveGeneratedPlaylist.mockResolvedValue(savedPlaylist)
    serviceMocks.deleteSavedPlaylist.mockResolvedValue('playlist-id')
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.save(generatedPlaylist)
    })

    act(() => {
      result.current.requestDeletion(savedPlaylist)
    })

    expect(result.current.needsDeletionConfirmation).toBe(true)
    expect(serviceMocks.deleteSavedPlaylist).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.confirmDeletion()
    })

    expect(serviceMocks.deleteSavedPlaylist).toHaveBeenCalledWith('playlist-id')
    expect(result.current.selectedPlaylistId).toBeNull()
    expect(result.current.selectedPlaylist).toBeNull()
    expect(result.current.needsDeletionConfirmation).toBe(false)
  })

  it('refreshes the selected playlist and replaces its cached detail', async () => {
    const originalPlaylist = {
      ...generatedPlaylist,
      id: 'playlist-id',
      status: 'EXPORTED' as const,
      createdAt: generatedPlaylist.generatedAt,
      updatedAt: generatedPlaylist.generatedAt,
      trackCount: 0,
    }
    const refreshedPlaylist = {
      ...originalPlaylist,
      status: 'DRAFT' as const,
      name: 'Refreshed playlist',
      updatedAt: new Date('2026-07-01T12:00:00.000Z'),
    }
    serviceMocks.getSavedPlaylist.mockResolvedValue(originalPlaylist)
    serviceMocks.refreshSavedPlaylist.mockResolvedValue(refreshedPlaylist)
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.selectPlaylist('playlist-id')
    })
    await waitFor(() => {
      expect(result.current.selectedPlaylist?.name).toBe(
        'Artist recent setlist',
      )
    })

    await act(async () => {
      await result.current.refresh('playlist-id')
    })

    expect(serviceMocks.refreshSavedPlaylist).toHaveBeenCalledWith(
      'playlist-id',
    )
    expect(result.current.selectedPlaylist).toEqual(refreshedPlaylist)
    expect(notificationMocks.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({ loading: 'Refreshing playlist' }),
    )
  })

  it('cancels a pending playlist deletion without mutating', () => {
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.requestDeletion({ id: 'playlist-id', name: 'Playlist' })
      result.current.cancelDeletion()
    })

    expect(result.current.needsDeletionConfirmation).toBe(false)
    expect(serviceMocks.deleteSavedPlaylist).not.toHaveBeenCalled()
  })

  it('retains deletion confirmation when deletion fails', async () => {
    serviceMocks.deleteSavedPlaylist.mockRejectedValue(
      new Error('Playlist could not be deleted'),
    )
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.requestDeletion({ id: 'playlist-id', name: 'Playlist' })
    })

    await expect(result.current.confirmDeletion()).rejects.toThrow(
      'Playlist could not be deleted',
    )

    expect(result.current.needsDeletionConfirmation).toBe(true)
  })

  it('does not call protected saved playlist reads when disabled', async () => {
    const { result } = renderHook(() => useSavedPlaylists({ enabled: false }), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.selectPlaylist('playlist-id')
    })

    await waitFor(() => {
      expect(result.current.selectedPlaylistId).toBe('playlist-id')
    })

    expect(serviceMocks.listSavedPlaylists).not.toHaveBeenCalled()
    expect(serviceMocks.getSavedPlaylist).not.toHaveBeenCalled()
  })

  it('does not expose a stale saved playlist while a new selection loads', async () => {
    serviceMocks.saveGeneratedPlaylist.mockResolvedValue({
      ...generatedPlaylist,
      id: 'playlist-a',
      status: 'DRAFT',
      createdAt: generatedPlaylist.generatedAt,
      updatedAt: generatedPlaylist.generatedAt,
      trackCount: 0,
    })
    serviceMocks.getSavedPlaylist.mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => {
            resolve({
              ...generatedPlaylist,
              id: 'playlist-b',
              status: 'DRAFT',
              createdAt: generatedPlaylist.generatedAt,
              updatedAt: generatedPlaylist.generatedAt,
              trackCount: 0,
            })
          }, 1)
        }),
    )
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.save(generatedPlaylist)
    })

    expect(result.current.selectedPlaylist?.id).toBe('playlist-a')

    act(() => {
      result.current.selectPlaylist('playlist-b')
    })

    expect(result.current.selectedPlaylist).toBeNull()

    await waitFor(() => {
      expect(result.current.selectedPlaylist?.id).toBe('playlist-b')
    })
  })

  it('identifies a missing selected playlist without retrying it', async () => {
    serviceMocks.getSavedPlaylist.mockRejectedValue(
      Object.assign(new Error('Playlist not found.'), {
        data: { code: 'NOT_FOUND' },
      }),
    )
    const { result } = renderHook(() => useSavedPlaylists(), {
      wrapper: createWrapper({ queryRetry: true }),
    })

    act(() => {
      result.current.selectPlaylist('missing-playlist-id')
    })

    await waitFor(() => {
      expect(result.current.isSelectedPlaylistNotFound).toBe(true)
    })
    expect(serviceMocks.getSavedPlaylist).toHaveBeenCalledOnce()
  })

  it('disconnects streaming providers through the streaming service', async () => {
    serviceMocks.disconnectStreamingProvider.mockResolvedValue({
      provider: 'SPOTIFY',
      connected: false,
      displayName: null,
      providerAccountId: null,
      canDisconnect: false,
      disconnectDisabledReason: null,
      updatedAt: null,
    })
    const { result } = renderHook(() => useStreamingConnections(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.disconnect('SPOTIFY')
    })

    expect(serviceMocks.disconnectStreamingProvider).toHaveBeenCalledWith(
      'SPOTIFY',
    )
    expect(notificationMocks.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Disconnecting Spotify',
        success: 'Spotify disconnected',
      }),
    )
  })

  it('connects Spotify through Better Auth inside the connection hook', async () => {
    authMocks.linkSocial.mockResolvedValue({
      data: { redirect: false },
      error: null,
    })
    const { result } = renderHook(() => useStreamingConnections(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.connectSpotify()
    })

    expect(authMocks.linkSocial).toHaveBeenCalledWith({
      provider: 'spotify',
      scopes: [...spotifyPlaylistExportScopes],
      callbackURL: '/profile',
    })
    expect(notificationMocks.info).toHaveBeenCalledWith(
      'Opening Spotify connection',
    )
    expect(notificationMocks.success).toHaveBeenCalledWith('Spotify connected')
    await waitFor(() => {
      expect(serviceMocks.listStreamingConnections).toHaveBeenCalled()
    })
  })

  it('matches and exports playlists through Spotify services', async () => {
    serviceMocks.matchPlaylistTracks.mockResolvedValue([
      {
        playlistTrackId: 'playlist-item-id',
        provider: 'SPOTIFY',
        status: 'MATCHED',
        providerTrackId: 'spotify-track-id',
        providerTrackUri: 'spotify:track:123',
        externalUrl: 'https://open.spotify.com/track/123',
        trackName: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        durationMs: 123000,
        matchConfidenceScore: 100,
      },
    ])
    serviceMocks.exportPlaylistToSpotify.mockResolvedValue({
      provider: 'SPOTIFY',
      providerPlaylistId: 'spotify-playlist-id',
      externalUrl: 'https://open.spotify.com/playlist/123',
      snapshotId: 'snapshot-id',
      exportedAt: generatedPlaylist.generatedAt,
      exportedTrackCount: 1,
    })
    const { result } = renderHook(() => useSpotify(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.matchTracks('playlist-id')
      await result.current.exportPlaylist({
        playlistId: 'playlist-id',
        name: 'Export name',
      })
    })

    expect(serviceMocks.matchPlaylistTracks).toHaveBeenCalledWith('playlist-id')
    expect(serviceMocks.exportPlaylistToSpotify).toHaveBeenCalledWith({
      playlistId: 'playlist-id',
      name: 'Export name',
    })
    expect(notificationMocks.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Matching tracks',
        error: 'Track matching failed',
      }),
    )
    expect(notificationMocks.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Exporting to Spotify',
        error: 'Spotify export failed',
      }),
    )
    expect(result.current.matches).toHaveLength(1)
    expect(result.current.exportResult?.providerPlaylistId).toBe(
      'spotify-playlist-id',
    )
  })

  it('loads, searches, and updates individual Spotify track decisions', async () => {
    const match = {
      playlistTrackId: 'playlist-item-id',
      provider: 'SPOTIFY' as const,
      status: 'MANUALLY_MATCHED' as const,
      providerTrackId: 'spotify-track-id',
      providerTrackUri: 'spotify:track:123',
      externalUrl: 'https://open.spotify.com/track/123',
      trackName: 'Track',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 123000,
      matchConfidenceScore: null,
    }
    serviceMocks.getSpotifyTrackMatches.mockResolvedValue([match])
    serviceMocks.searchSpotifyTrackCandidates.mockResolvedValue([
      {
        provider: 'SPOTIFY',
        providerTrackId: 'spotify-track-id',
        externalUrl: 'https://open.spotify.com/track/123',
        title: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        durationMs: 123000,
      },
    ])
    serviceMocks.selectSpotifyTrack.mockResolvedValue(match)
    serviceMocks.skipSpotifyTrack.mockResolvedValue({
      ...match,
      status: 'SKIPPED',
      providerTrackId: null,
      providerTrackUri: null,
      externalUrl: null,
      trackName: null,
      artistName: null,
      albumName: null,
      durationMs: null,
    })
    const { result } = renderHook(() => useSpotify(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.loadMatches('playlist-id')
      await result.current.searchTracks({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        query: 'track',
      })
      await result.current.selectTrack({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        spotifyTrackId: 'spotify-track-id',
      })
      await result.current.skipTrack({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
      })
    })

    expect(result.current.candidates).toHaveLength(1)
    expect(result.current.matches[0]?.status).toBe('SKIPPED')
    expect(serviceMocks.searchSpotifyTrackCandidates).toHaveBeenCalledWith(
      {
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        query: 'track',
      },
    )
  })

  it('does not let an older Spotify search overwrite newer candidates', async () => {
    const olderSearch = createDeferred<Array<StreamingTrackCandidate>>()
    const newerSearch = createDeferred<Array<StreamingTrackCandidate>>()
    const olderCandidate: StreamingTrackCandidate = {
      provider: 'SPOTIFY' as const,
      providerTrackId: 'older-track-id',
      externalUrl: null,
      title: 'Older result',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 120000,
    }
    const newerCandidate = {
      ...olderCandidate,
      providerTrackId: 'newer-track-id',
      title: 'Newer result',
    }
    serviceMocks.searchSpotifyTrackCandidates
      .mockReturnValueOnce(olderSearch.promise)
      .mockReturnValueOnce(newerSearch.promise)
    const { result } = renderHook(() => useSpotify(), {
      wrapper: createWrapper(),
    })
    let olderSearchPromise!: Promise<Array<StreamingTrackCandidate>>
    let newerSearchPromise!: Promise<Array<StreamingTrackCandidate>>

    act(() => {
      olderSearchPromise = result.current.searchTracks({
        playlistId: 'playlist-id',
        playlistItemId: 'older-item-id',
        query: 'track',
      })
      newerSearchPromise = result.current.searchTracks({
        playlistId: 'playlist-id',
        playlistItemId: 'newer-item-id',
        query: 'track',
      })
    })

    await act(async () => {
      newerSearch.resolve([newerCandidate])
      await newerSearchPromise
    })
    expect(result.current.candidates).toEqual([newerCandidate])

    await act(async () => {
      olderSearch.resolve([olderCandidate])
      await olderSearchPromise
    })
    expect(result.current.candidates).toEqual([newerCandidate])
  })

  it('does not let a stale Spotify match load overwrite reset state', async () => {
    const olderMatches = createDeferred<Array<TrackMatch>>()
    const newerMatches = createDeferred<Array<TrackMatch>>()
    const olderMatch: TrackMatch = {
      playlistTrackId: 'older-track-id',
      provider: 'SPOTIFY' as const,
      status: 'MATCHED' as const,
      providerTrackId: 'older-spotify-track-id',
      providerTrackUri: 'spotify:track:older',
      externalUrl: null,
      trackName: 'Older track',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 120000,
      matchConfidenceScore: 100,
    }
    const newerMatch: TrackMatch = {
      ...olderMatch,
      playlistTrackId: 'newer-track-id',
      providerTrackId: 'newer-spotify-track-id',
      providerTrackUri: 'spotify:track:newer',
      trackName: 'Newer track',
    }
    serviceMocks.getSpotifyTrackMatches
      .mockReturnValueOnce(olderMatches.promise)
      .mockReturnValueOnce(newerMatches.promise)
    const { result } = renderHook(() => useSpotify(), {
      wrapper: createWrapper(),
    })
    let olderLoad!: Promise<Array<TrackMatch>>
    let newerLoad!: Promise<Array<TrackMatch>>

    act(() => {
      olderLoad = result.current.loadMatches('playlist-a')
      result.current.reset()
      newerLoad = result.current.loadMatches('playlist-b')
    })

    await act(async () => {
      newerMatches.resolve([newerMatch])
      await newerLoad
    })
    expect(result.current.matches).toEqual([newerMatch])

    await act(async () => {
      olderMatches.resolve([olderMatch])
      await olderLoad
    })
    expect(result.current.matches).toEqual([newerMatch])
  })
})
