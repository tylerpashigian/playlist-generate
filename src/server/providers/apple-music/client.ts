import {
  AppleMusicAuthorizationError,
  ExternalProviderError,
} from '@/server/errors'
import {
  appleMusicCatalogSearchResponseSchema,
  appleMusicPlaylistResponseSchema,
  appleMusicSongResponseSchema,
  appleMusicStorefrontResponseSchema,
} from './schemas'
import type { AppleMusicSong } from './schemas'

const APPLE_MUSIC_API_URL = 'https://api.music.apple.com/v1'

type AppleMusicAuth = { developerToken: string; musicUserToken: string }

async function appleMusicFetch(
  path: string,
  auth: AppleMusicAuth,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${APPLE_MUSIC_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.developerToken}`,
      'Music-User-Token': auth.musicUserToken,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      throw new AppleMusicAuthorizationError()
    }
    throw new ExternalProviderError('Apple Music', response.status)
  }

  if (response.status === 204) return null
  return response.json() as Promise<unknown>
}

export async function getAppleMusicStorefront(auth: AppleMusicAuth) {
  return appleMusicStorefrontResponseSchema.parse(
    await appleMusicFetch('/me/storefront', auth),
  )
}

export async function searchAppleMusicSongs(
  auth: AppleMusicAuth,
  storefrontId: string,
  term: string,
) {
  const params = new URLSearchParams({ term, types: 'songs', limit: '5' })
  return appleMusicCatalogSearchResponseSchema.parse(
    await appleMusicFetch(
      `/catalog/${encodeURIComponent(storefrontId)}/search?${params.toString()}`,
      auth,
    ),
  )
}

export async function getAppleMusicSong(
  auth: AppleMusicAuth,
  storefrontId: string,
  songId: string,
): Promise<AppleMusicSong> {
  const response = appleMusicSongResponseSchema.parse(
    await appleMusicFetch(
      `/catalog/${encodeURIComponent(storefrontId)}/songs/${encodeURIComponent(songId)}`,
      auth,
    ),
  )
  return response.data[0]
}

export async function createAppleMusicPlaylist(
  auth: AppleMusicAuth,
  playlist: {
    name: string
    description?: string | null
    songIds: Array<string>
  },
) {
  return appleMusicPlaylistResponseSchema.parse(
    await appleMusicFetch('/me/library/playlists', auth, {
      method: 'POST',
      body: JSON.stringify({
        attributes: {
          name: playlist.name,
          description: playlist.description ?? undefined,
        },
        relationships: {
          tracks: {
            data: playlist.songIds.map((id) => ({ id, type: 'songs' })),
          },
        },
      }),
    }),
  )
}
