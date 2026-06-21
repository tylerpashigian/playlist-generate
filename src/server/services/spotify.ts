import { prisma } from '#/db'
import {
  exportPlaylistDtoSchema,
  trackMatchDtoSchema,
} from '#/server/contracts/spotify'
import { NoMatchedTracksError } from '#/server/errors'
import {
  addSpotifyPlaylistItems,
  createSpotifyPlaylist,
  searchSpotifyTrack,
} from '#/server/providers/spotify/client'
import { getStreamingProviderAccessToken } from './streaming-connections'
import type { SavedPlaylistDto } from '#/server/contracts/playlists'
import type {
  ExportPlaylistDto,
  TrackMatchDto,
} from '#/server/contracts/spotify'
import type { SpotifyTrackResponse } from '#/server/providers/spotify/schemas'

const SPOTIFY_PROVIDER = 'SPOTIFY'
const MATCH_THRESHOLD = 70

async function getValidSpotifyAccessToken(userId: string) {
  return getStreamingProviderAccessToken(userId, SPOTIFY_PROVIDER)
}

function getSearchQuery(
  playlist: SavedPlaylistDto,
  item: SavedPlaylistDto['items'][number],
  useCoverArtist: boolean,
) {
  const artistName =
    useCoverArtist && item.originalArtistName
      ? item.originalArtistName
      : playlist.artist.name

  return `track:${item.songTitle} artist:${artistName}`
}

function getMatchScore(
  track: SpotifyTrackResponse,
  item: SavedPlaylistDto['items'][number],
) {
  const trackName = track.name.toLocaleLowerCase()
  const songTitle = item.songTitle.toLocaleLowerCase()

  if (trackName === songTitle) return 100
  if (trackName.includes(songTitle) || songTitle.includes(trackName)) return 80

  return 50
}

async function findSpotifyTrackMatch(
  accessToken: string,
  playlist: SavedPlaylistDto,
  item: SavedPlaylistDto['items'][number],
) {
  const queries = [
    getSearchQuery(playlist, item, false),
    ...(item.isCover ? [getSearchQuery(playlist, item, true)] : []),
  ]

  for (const query of queries) {
    const result = await searchSpotifyTrack(accessToken, query)

    if (result.tracks.items.length === 0) continue

    const track = result.tracks.items[0]

    return {
      track,
      score: getMatchScore(track, item),
    }
  }

  return null
}

function mapTrackMatch(
  playlistItemId: string,
  result: Awaited<ReturnType<typeof findSpotifyTrackMatch>>,
): TrackMatchDto {
  if (!result) {
    return trackMatchDtoSchema.parse({
      playlistItemId,
      provider: SPOTIFY_PROVIDER,
      status: 'UNRESOLVED',
      providerTrackId: null,
      providerTrackUri: null,
      providerTrackUrl: null,
      trackName: null,
      artistName: null,
      albumName: null,
      durationMs: null,
      matchConfidenceScore: null,
    })
  }

  return trackMatchDtoSchema.parse({
    playlistItemId,
    provider: SPOTIFY_PROVIDER,
    status: result.score >= MATCH_THRESHOLD ? 'MATCHED' : 'LOW_CONFIDENCE',
    providerTrackId: result.track.id,
    providerTrackUri: result.track.uri,
    providerTrackUrl: result.track.external_urls?.spotify ?? null,
    trackName: result.track.name,
    artistName: result.track.artists.map((artist) => artist.name).join(', '),
    albumName: result.track.album.name,
    durationMs: result.track.duration_ms,
    matchConfidenceScore: result.score,
  })
}

export async function matchSpotifyTracks(
  userId: string,
  playlist: SavedPlaylistDto,
) {
  const { accessToken } = await getValidSpotifyAccessToken(userId)
  const matches: Array<TrackMatchDto> = []

  for (const item of playlist.items) {
    if (!item.id) continue

    const result = await findSpotifyTrackMatch(accessToken, playlist, item)
    const match = mapTrackMatch(item.id, result)

    const savedMatch = await prisma.trackMatch.upsert({
      where: {
        playlistItemId_provider: {
          playlistItemId: item.id,
          provider: SPOTIFY_PROVIDER,
        },
      },
      update: {
        status: match.status,
        providerTrackId: match.providerTrackId,
        providerTrackUri: match.providerTrackUri,
        providerTrackUrl: match.providerTrackUrl,
        trackName: match.trackName,
        artistName: match.artistName,
        albumName: match.albumName,
        durationMs: match.durationMs,
        matchConfidenceScore: match.matchConfidenceScore,
        selectedAt: match.status === 'MATCHED' ? new Date() : null,
      },
      create: {
        playlistItemId: item.id,
        provider: SPOTIFY_PROVIDER,
        status: match.status,
        providerTrackId: match.providerTrackId,
        providerTrackUri: match.providerTrackUri,
        providerTrackUrl: match.providerTrackUrl,
        trackName: match.trackName,
        artistName: match.artistName,
        albumName: match.albumName,
        durationMs: match.durationMs,
        matchConfidenceScore: match.matchConfidenceScore,
        selectedAt: match.status === 'MATCHED' ? new Date() : null,
      },
    })

    matches.push(
      trackMatchDtoSchema.parse({
        id: savedMatch.id,
        playlistItemId: savedMatch.playlistItemId,
        provider: savedMatch.provider,
        status: savedMatch.status,
        providerTrackId: savedMatch.providerTrackId,
        providerTrackUri: savedMatch.providerTrackUri,
        providerTrackUrl: savedMatch.providerTrackUrl,
        trackName: savedMatch.trackName,
        artistName: savedMatch.artistName,
        albumName: savedMatch.albumName,
        durationMs: savedMatch.durationMs,
        matchConfidenceScore: savedMatch.matchConfidenceScore,
      }),
    )
  }

  return matches
}

function chunk<T>(items: Array<T>, size: number) {
  const chunks: Array<Array<T>> = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export async function exportSpotifyPlaylist(
  userId: string,
  playlist: SavedPlaylistDto,
  name?: string,
): Promise<ExportPlaylistDto> {
  const { accessToken, providerAccountId } =
    await getValidSpotifyAccessToken(userId)
  const itemIds = playlist.items
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id))
  const matches = await prisma.trackMatch.findMany({
    where: {
      playlistItemId: { in: itemIds },
      provider: SPOTIFY_PROVIDER,
      status: 'MATCHED',
      providerTrackUri: { not: null },
    },
    orderBy: {
      playlistItem: { position: 'asc' },
    },
  })
  const uris = matches
    .map((match) => match.providerTrackUri)
    .filter((uri): uri is string => Boolean(uri))

  if (uris.length === 0) {
    throw new NoMatchedTracksError()
  }

  const createdPlaylist = await createSpotifyPlaylist(
    accessToken,
    providerAccountId,
    {
      name: name ?? playlist.name,
      description: playlist.description,
    },
  )
  let snapshotId: string | null = null

  for (const batch of chunk(uris, 100)) {
    const addItemsResult = await addSpotifyPlaylistItems(
      accessToken,
      createdPlaylist.id,
      batch,
    )

    snapshotId = addItemsResult.snapshot_id ?? snapshotId
  }

  const externalPlaylist = await prisma.externalPlaylist.upsert({
    where: {
      playlistId_provider: {
        playlistId: playlist.id,
        provider: SPOTIFY_PROVIDER,
      },
    },
    update: {
      providerPlaylistId: createdPlaylist.id,
      url: createdPlaylist.external_urls?.spotify ?? null,
      snapshotId,
      exportedAt: new Date(),
    },
    create: {
      playlistId: playlist.id,
      provider: SPOTIFY_PROVIDER,
      providerPlaylistId: createdPlaylist.id,
      url: createdPlaylist.external_urls?.spotify ?? null,
      snapshotId,
    },
  })

  await prisma.playlist.update({
    where: { id: playlist.id },
    data: { status: 'EXPORTED' },
  })

  return exportPlaylistDtoSchema.parse({
    provider: externalPlaylist.provider,
    providerPlaylistId: externalPlaylist.providerPlaylistId,
    url: externalPlaylist.url,
    snapshotId: externalPlaylist.snapshotId,
    exportedAt: externalPlaylist.exportedAt,
    exportedTrackCount: uris.length,
  })
}
