// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useArtist } from './use-artist'
import { useDebouncedValue } from './use-debounced-value'
import { useGeneratedPlaylist } from './use-generated-playlist'
import { useSavedPlaylists } from './use-saved-playlists'
import { useSpotify } from './use-spotify'
import { useStreamingConnections } from './use-streaming-connections'
import type { ReactNode } from 'react'
import type { Artist } from '@/models/artists/models'
import type { GeneratedPlaylist } from '@/models/playlists/models'

const serviceMocks = vi.hoisted(() => ({
  searchArtists: vi.fn(),
  generatePlaylist: vi.fn(),
  saveGeneratedPlaylist: vi.fn(),
  listSavedPlaylists: vi.fn(),
  getSavedPlaylist: vi.fn(),
  listStreamingConnections: vi.fn(),
  disconnectStreamingProvider: vi.fn(),
  matchPlaylistTracks: vi.fn(),
  exportPlaylistToSpotify: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  linkSocial: vi.fn(),
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
  listSavedPlaylists: serviceMocks.listSavedPlaylists,
  getSavedPlaylist: serviceMocks.getSavedPlaylist,
}))

vi.mock('@/services/streaming', () => ({
  listStreamingConnections: serviceMocks.listStreamingConnections,
  disconnectStreamingProvider: serviceMocks.disconnectStreamingProvider,
}))

vi.mock('@/services/spotify', () => ({
  matchPlaylistTracks: serviceMocks.matchPlaylistTracks,
  exportPlaylistToSpotify: serviceMocks.exportPlaylistToSpotify,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    linkSocial: authMocks.linkSocial,
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

        async function generate(artist: Artist) {
          artistSearch.selectArtist(artist)
          await generated.generate(artist)
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
    )
    expect(result.current.selectedPlaylistId).toBe('playlist-id')
    expect(notificationMocks.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Saving playlist',
        error: 'Playlist could not be saved',
      }),
    )
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

  it('disconnects streaming providers through the streaming service', async () => {
    serviceMocks.disconnectStreamingProvider.mockResolvedValue({
      provider: 'SPOTIFY',
      connected: false,
      displayName: null,
      providerAccountId: null,
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
      scopes: ['playlist-modify-private'],
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
})
