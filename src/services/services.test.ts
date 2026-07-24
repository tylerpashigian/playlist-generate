import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchArtists } from './artists'
import {
  deleteSavedPlaylist,
  generatePlaylist,
  refreshSavedPlaylist,
  saveGeneratedPlaylist,
} from './playlists'
import { disconnectStreamingProvider } from './streaming'
import {
  exportPlaylistToSpotify,
  getSpotifyTrackMatches,
  matchPlaylistTracks,
  searchSpotifyTrackCandidates,
  selectSpotifyTrack,
  skipSpotifyTrack,
} from './spotify'

const trpcMocks = vi.hoisted(() => ({
  artistsSearchQuery: vi.fn(),
  playlistsGenerateMutate: vi.fn(),
  playlistsSaveMutate: vi.fn(),
  playlistsListQuery: vi.fn(),
  playlistsGetQuery: vi.fn(),
  playlistsDeleteMutate: vi.fn(),
  playlistsRefreshMutate: vi.fn(),
  streamingConnectionsQuery: vi.fn(),
  streamingDisconnectMutate: vi.fn(),
  spotifyMatchTracksMutate: vi.fn(),
  spotifyMatchesQuery: vi.fn(),
  spotifySearchTracksMutate: vi.fn(),
  spotifySelectTrackMutate: vi.fn(),
  spotifySkipTrackMutate: vi.fn(),
  spotifyExportPlaylistMutate: vi.fn(),
}))

vi.mock('@/lib/trpc-client', () => ({
  trpcClient: {
    artists: {
      search: { query: trpcMocks.artistsSearchQuery },
    },
    playlists: {
      generate: { mutate: trpcMocks.playlistsGenerateMutate },
      save: { mutate: trpcMocks.playlistsSaveMutate },
      list: { query: trpcMocks.playlistsListQuery },
      get: { query: trpcMocks.playlistsGetQuery },
      delete: { mutate: trpcMocks.playlistsDeleteMutate },
      refresh: { mutate: trpcMocks.playlistsRefreshMutate },
    },
    streaming: {
      connections: { query: trpcMocks.streamingConnectionsQuery },
      disconnect: { mutate: trpcMocks.streamingDisconnectMutate },
    },
    spotify: {
      matchTracks: { mutate: trpcMocks.spotifyMatchTracksMutate },
      matches: { query: trpcMocks.spotifyMatchesQuery },
      searchTracks: { mutate: trpcMocks.spotifySearchTracksMutate },
      selectTrack: { mutate: trpcMocks.spotifySelectTrackMutate },
      skipTrack: { mutate: trpcMocks.spotifySkipTrackMutate },
      exportPlaylist: { mutate: trpcMocks.spotifyExportPlaylistMutate },
    },
  },
}))

const artistDto = {
  mbid: 'artist-mbid',
  name: 'Artist',
  sortName: null,
  disambiguation: null,
  setlistfmUrl: null,
}

const generatedAt = new Date('2026-06-01T12:00:00.000Z')
const generatedPlaylistDto = {
  artist: artistDto,
  name: 'Artist recent setlist',
  description: null,
  scoringVersion: 'recent-weighted-v1',
  recentSetlistCount: 1,
  generatedAt,
  items: [],
}

describe('frontend services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches artists and returns frontend models', async () => {
    trpcMocks.artistsSearchQuery.mockResolvedValue([artistDto])

    await expect(searchArtists('artist')).resolves.toEqual([
      {
        mbid: 'artist-mbid',
        name: 'Artist',
        sortName: null,
        disambiguation: null,
        setlistfmUrl: null,
      },
    ])
    expect(trpcMocks.artistsSearchQuery).toHaveBeenCalledWith({
      query: 'artist',
    })
  })

  it('generates and saves playlists through tRPC procedures', async () => {
    trpcMocks.playlistsGenerateMutate.mockResolvedValue(generatedPlaylistDto)
    trpcMocks.playlistsSaveMutate.mockResolvedValue({
      ...generatedPlaylistDto,
      id: 'saved-playlist-id',
      status: 'DRAFT',
      createdAt: generatedAt,
      updatedAt: generatedAt,
      itemCount: 0,
    })

    const generatedPlaylist = await generatePlaylist({
      mbid: 'artist-mbid',
      name: 'Artist',
      sortName: null,
      disambiguation: null,
      setlistfmUrl: null,
    })
    const savedPlaylist = await saveGeneratedPlaylist(generatedPlaylist)

    expect(trpcMocks.playlistsGenerateMutate).toHaveBeenCalledWith({
      artist: artistDto,
    })
    expect(trpcMocks.playlistsSaveMutate).toHaveBeenCalledWith({
      playlist: generatedPlaylistDto,
      mode: 'create',
    })
    expect(savedPlaylist).toMatchObject({
      id: 'saved-playlist-id',
      trackCount: 0,
      tracks: [],
    })
  })

  it('sends replace mode when replacing a saved playlist', async () => {
    trpcMocks.playlistsSaveMutate.mockResolvedValue({
      ...generatedPlaylistDto,
      id: 'saved-playlist-id',
      status: 'DRAFT',
      createdAt: generatedAt,
      updatedAt: generatedAt,
      itemCount: 0,
    })

    await saveGeneratedPlaylist(
      {
        artist: {
          mbid: 'artist-mbid',
          name: 'Artist',
          sortName: null,
          disambiguation: null,
          setlistfmUrl: null,
        },
        name: 'Artist recent setlist',
        description: null,
        scoringVersion: 'recent-weighted-v1',
        recentSetlistCount: 1,
        generatedAt,
        tracks: [],
      },
      { mode: 'replace' },
    )

    expect(trpcMocks.playlistsSaveMutate).toHaveBeenCalledWith({
      playlist: generatedPlaylistDto,
      mode: 'replace',
    })
  })

  it('deletes saved playlists through tRPC', async () => {
    trpcMocks.playlistsDeleteMutate.mockResolvedValue({
      playlistId: 'saved-playlist-id',
    })

    await expect(deleteSavedPlaylist('saved-playlist-id')).resolves.toBe(
      'saved-playlist-id',
    )
    expect(trpcMocks.playlistsDeleteMutate).toHaveBeenCalledWith({
      playlistId: 'saved-playlist-id',
    })
  })

  it('refreshes saved playlists through tRPC', async () => {
    trpcMocks.playlistsRefreshMutate.mockResolvedValue({
      ...generatedPlaylistDto,
      id: 'saved-playlist-id',
      status: 'DRAFT',
      createdAt: generatedAt,
      updatedAt: generatedAt,
      itemCount: 0,
    })

    await expect(refreshSavedPlaylist('saved-playlist-id')).resolves.toMatchObject(
      { id: 'saved-playlist-id', trackCount: 0 },
    )
    expect(trpcMocks.playlistsRefreshMutate).toHaveBeenCalledWith({
      playlistId: 'saved-playlist-id',
    })
  })

  it('disconnects streaming providers and returns connection models', async () => {
    trpcMocks.streamingDisconnectMutate.mockResolvedValue({
      provider: 'SPOTIFY',
      connected: false,
      displayName: null,
      providerAccountId: null,
      canDisconnect: false,
      disconnectDisabledReason: null,
      updatedAt: null,
    })

    await expect(disconnectStreamingProvider('SPOTIFY')).resolves.toMatchObject(
      {
        provider: 'SPOTIFY',
        connected: false,
      },
    )
    expect(trpcMocks.streamingDisconnectMutate).toHaveBeenCalledWith({
      provider: 'SPOTIFY',
    })
  })

  it('matches and exports Spotify playlists through tRPC procedures', async () => {
    trpcMocks.spotifyMatchTracksMutate.mockResolvedValue([
      {
        playlistItemId: 'playlist-item-id',
        provider: 'SPOTIFY',
        status: 'MATCHED',
        providerTrackId: 'spotify-track-id',
        providerTrackUri: 'spotify:track:123',
        providerTrackUrl: 'https://open.spotify.com/track/123',
        trackName: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        durationMs: 123000,
        matchConfidenceScore: 100,
      },
    ])
    trpcMocks.spotifyExportPlaylistMutate.mockResolvedValue({
      provider: 'SPOTIFY',
      providerPlaylistId: 'spotify-playlist-id',
      url: 'https://open.spotify.com/playlist/123',
      snapshotId: 'snapshot-id',
      exportedAt: generatedAt,
      exportedTrackCount: 1,
    })

    await expect(matchPlaylistTracks('playlist-id')).resolves.toEqual([
      expect.objectContaining({
        playlistTrackId: 'playlist-item-id',
        externalUrl: 'https://open.spotify.com/track/123',
      }),
    ])
    await expect(
      exportPlaylistToSpotify({
        playlistId: 'playlist-id',
        name: 'Export name',
      }),
    ).resolves.toMatchObject({
      providerPlaylistId: 'spotify-playlist-id',
      externalUrl: 'https://open.spotify.com/playlist/123',
    })
    expect(trpcMocks.spotifyMatchTracksMutate).toHaveBeenCalledWith({
      playlistId: 'playlist-id',
    })
    expect(trpcMocks.spotifyExportPlaylistMutate).toHaveBeenCalledWith({
      playlistId: 'playlist-id',
      name: 'Export name',
    })
  })

  it('searches, selects, and skips individual Spotify tracks through tRPC', async () => {
    const trackMatch = {
      playlistItemId: 'playlist-item-id',
      provider: 'SPOTIFY',
      status: 'MANUALLY_MATCHED',
      providerTrackId: 'spotify-track-id',
      providerTrackUri: 'spotify:track:123',
      providerTrackUrl: 'https://open.spotify.com/track/123',
      trackName: 'Track',
      artistName: 'Artist',
      albumName: 'Album',
      durationMs: 123000,
      matchConfidenceScore: null,
    }
    trpcMocks.spotifyMatchesQuery.mockResolvedValue([trackMatch])
    trpcMocks.spotifySearchTracksMutate.mockResolvedValue([
      {
        id: 'spotify-track-id',
        uri: 'spotify:track:123',
        externalUrl: 'https://open.spotify.com/track/123',
        name: 'Track',
        artistName: 'Artist',
        albumName: 'Album',
        durationMs: 123000,
      },
    ])
    trpcMocks.spotifySelectTrackMutate.mockResolvedValue(trackMatch)
    trpcMocks.spotifySkipTrackMutate.mockResolvedValue({
      ...trackMatch,
      status: 'SKIPPED',
      providerTrackId: null,
      providerTrackUri: null,
      providerTrackUrl: null,
      trackName: null,
      artistName: null,
      albumName: null,
      durationMs: null,
    })

    await expect(getSpotifyTrackMatches('playlist-id')).resolves.toHaveLength(1)
    await expect(
      searchSpotifyTrackCandidates({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        query: 'track',
      }),
    ).resolves.toMatchObject([
      {
        provider: 'SPOTIFY',
        providerTrackId: 'spotify-track-id',
        title: 'Track',
      },
    ])
    await expect(
      selectSpotifyTrack({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
        spotifyTrackId: 'spotify-track-id',
      }),
    ).resolves.toMatchObject({ status: 'MANUALLY_MATCHED' })
    await expect(
      skipSpotifyTrack({
        playlistId: 'playlist-id',
        playlistItemId: 'playlist-item-id',
      }),
    ).resolves.toMatchObject({ status: 'SKIPPED' })

    expect(trpcMocks.spotifyMatchesQuery).toHaveBeenCalledWith({
      playlistId: 'playlist-id',
    })
    expect(trpcMocks.spotifySearchTracksMutate).toHaveBeenCalledWith({
      playlistId: 'playlist-id',
      playlistItemId: 'playlist-item-id',
      query: 'track',
    })
  })
})
