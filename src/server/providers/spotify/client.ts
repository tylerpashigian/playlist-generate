import { ExternalProviderError } from '@/server/errors'
import {
  spotifyAddItemsResponseSchema,
  spotifyCreatePlaylistResponseSchema,
  spotifyProfileResponseSchema,
  spotifySearchResponseSchema,
} from './schemas'
import type {
  SpotifyAddItemsResponse,
  SpotifyCreatePlaylistResponse,
  SpotifyProfileResponse,
  SpotifySearchResponse,
} from './schemas'

const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

async function spotifyFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new ExternalProviderError('Spotify', response.status)
  }

  return response.json() as Promise<unknown>
}

export async function getSpotifyProfile(
  accessToken: string,
): Promise<SpotifyProfileResponse> {
  return spotifyProfileResponseSchema.parse(
    await spotifyFetch('/me', accessToken),
  )
}

export async function searchSpotifyTrack(
  accessToken: string,
  query: string,
): Promise<SpotifySearchResponse> {
  const searchParams = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '5',
  })

  return spotifySearchResponseSchema.parse(
    await spotifyFetch(`/search?${searchParams.toString()}`, accessToken),
  )
}

export async function createSpotifyPlaylist(
  accessToken: string,
  providerAccountId: string,
  playlist: {
    name: string
    description?: string | null
  },
): Promise<SpotifyCreatePlaylistResponse> {
  return spotifyCreatePlaylistResponseSchema.parse(
    await spotifyFetch(`/users/${providerAccountId}/playlists`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        name: playlist.name,
        description: playlist.description ?? undefined,
        public: false,
      }),
    }),
  )
}

export async function addSpotifyPlaylistItems(
  accessToken: string,
  spotifyPlaylistId: string,
  uris: Array<string>,
): Promise<SpotifyAddItemsResponse> {
  return spotifyAddItemsResponseSchema.parse(
    await spotifyFetch(`/playlists/${spotifyPlaylistId}/tracks`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ uris }),
    }),
  )
}
