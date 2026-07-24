import { prisma } from '@/db'
import {
  exportPlaylistDtoSchema,
  spotifyTrackCandidateDtoSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/spotify'
import {
  NoMatchedTracksError,
  PlaylistItemNotFoundError,
  UnresolvedTrackMatchesError,
} from '@/server/errors'
import {
  addSpotifyPlaylistItems,
  createSpotifyPlaylist,
  getSpotifyTrack,
  searchSpotifyTrack,
} from '@/server/providers/spotify/client'
import { getStreamingProviderAccessToken } from './streaming-connections'
import type { SavedPlaylistDto } from '@/server/contracts/playlists'
import type {
  ExportPlaylistDto,
  SpotifyTrackCandidateDto,
  TrackMatchDto,
} from '@/server/contracts/spotify'
import type { SpotifyTrackResponse } from '@/server/providers/spotify/schemas'

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

function mapSpotifyTrackCandidate(
  track: SpotifyTrackResponse,
): SpotifyTrackCandidateDto {
  return spotifyTrackCandidateDtoSchema.parse({
    id: track.id,
    uri: track.uri,
    externalUrl: track.external_urls?.spotify ?? null,
    name: track.name,
    artistName: track.artists.map((artist) => artist.name).join(', '),
    albumName: track.album.name,
    durationMs: track.duration_ms,
  })
}

function mapSavedTrackMatch(match: {
  id: string
  playlistItemId: string
  provider: 'SPOTIFY'
  status: 'MATCHED' | 'MANUALLY_MATCHED' | 'LOW_CONFIDENCE' | 'UNRESOLVED' | 'SKIPPED'
  providerTrackId: string | null
  providerTrackUri: string | null
  providerTrackUrl: string | null
  trackName: string | null
  artistName: string | null
  albumName: string | null
  durationMs: number | null
  matchConfidenceScore: number | null
}): TrackMatchDto {
  return trackMatchDtoSchema.parse({
    id: match.id,
    playlistItemId: match.playlistItemId,
    provider: match.provider,
    status: match.status,
    providerTrackId: match.providerTrackId,
    providerTrackUri: match.providerTrackUri,
    providerTrackUrl: match.providerTrackUrl,
    trackName: match.trackName,
    artistName: match.artistName,
    albumName: match.albumName,
    durationMs: match.durationMs,
    matchConfidenceScore: match.matchConfidenceScore,
  })
}

export async function matchSpotifyTracks(
  userId: string,
  playlist: SavedPlaylistDto,
) {
  const { accessToken } = await getValidSpotifyAccessToken(userId)
  const includedItems = playlist.items.filter((item) => item.isIncluded)
  const existingDecisions = await prisma.trackMatch.findMany({
    where: {
      playlistItemId: {
        in: includedItems
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id)),
      },
      provider: SPOTIFY_PROVIDER,
      status: { in: ['MANUALLY_MATCHED', 'SKIPPED'] },
    },
  })
  const preservedDecisionItemIds = new Set(
    existingDecisions.map((match) => match.playlistItemId),
  )
  const matches: Array<TrackMatchDto> = []

  for (const item of includedItems) {
    if (!item.id) continue

    if (preservedDecisionItemIds.has(item.id)) {
      const decision = existingDecisions.find(
        (match) => match.playlistItemId === item.id,
      )

      if (decision) {
        matches.push(mapSavedTrackMatch(decision))
      }

      continue
    }

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

async function requireSpotifyPlaylistItem(
  userId: string,
  playlistId: string,
  playlistItemId: string,
) {
  const item = await prisma.playlistItem.findFirst({
    where: {
      id: playlistItemId,
      playlistId,
      playlist: { userId },
    },
  })

  if (!item || !item.isIncluded) {
    throw new PlaylistItemNotFoundError()
  }

  return item
}

export async function getSpotifyTrackMatches(
  userId: string,
  playlistId: string,
) {
  await prisma.playlist.findFirstOrThrow({
    where: { id: playlistId, userId },
    select: { id: true },
  })

  const matches = await prisma.trackMatch.findMany({
    where: {
      provider: SPOTIFY_PROVIDER,
      playlistItem: { playlistId },
    },
    orderBy: { playlistItem: { position: 'asc' } },
  })

  return matches.map(mapSavedTrackMatch)
}

export async function searchSpotifyTrackCandidates(
  userId: string,
  input: {
    playlistId: string
    playlistItemId: string
    query: string
  },
) {
  await requireSpotifyPlaylistItem(
    userId,
    input.playlistId,
    input.playlistItemId,
  )
  const { accessToken } = await getValidSpotifyAccessToken(userId)
  const result = await searchSpotifyTrack(accessToken, input.query)

  return result.tracks.items.map(mapSpotifyTrackCandidate)
}

export async function selectSpotifyTrackMatch(
  userId: string,
  input: {
    playlistId: string
    playlistItemId: string
    spotifyTrackId: string
  },
) {
  const item = await requireSpotifyPlaylistItem(
    userId,
    input.playlistId,
    input.playlistItemId,
  )
  const { accessToken } = await getValidSpotifyAccessToken(userId)
  const track = await getSpotifyTrack(accessToken, input.spotifyTrackId)
  const savedMatch = await prisma.trackMatch.upsert({
    where: {
      playlistItemId_provider: {
        playlistItemId: item.id,
        provider: SPOTIFY_PROVIDER,
      },
    },
    update: {
      status: 'MANUALLY_MATCHED',
      providerTrackId: track.id,
      providerTrackUri: track.uri,
      providerTrackUrl: track.external_urls?.spotify ?? null,
      trackName: track.name,
      artistName: track.artists.map((artist) => artist.name).join(', '),
      albumName: track.album.name,
      durationMs: track.duration_ms,
      matchConfidenceScore: null,
      selectedAt: new Date(),
    },
    create: {
      playlistItemId: item.id,
      provider: SPOTIFY_PROVIDER,
      status: 'MANUALLY_MATCHED',
      providerTrackId: track.id,
      providerTrackUri: track.uri,
      providerTrackUrl: track.external_urls?.spotify ?? null,
      trackName: track.name,
      artistName: track.artists.map((artist) => artist.name).join(', '),
      albumName: track.album.name,
      durationMs: track.duration_ms,
      matchConfidenceScore: null,
      selectedAt: new Date(),
    },
  })

  return mapSavedTrackMatch(savedMatch)
}

export async function skipSpotifyTrackMatch(
  userId: string,
  input: { playlistId: string; playlistItemId: string },
) {
  const item = await requireSpotifyPlaylistItem(
    userId,
    input.playlistId,
    input.playlistItemId,
  )
  const savedMatch = await prisma.trackMatch.upsert({
    where: {
      playlistItemId_provider: {
        playlistItemId: item.id,
        provider: SPOTIFY_PROVIDER,
      },
    },
    update: {
      status: 'SKIPPED',
      providerTrackId: null,
      providerTrackUri: null,
      providerTrackUrl: null,
      trackName: null,
      artistName: null,
      albumName: null,
      durationMs: null,
      matchConfidenceScore: null,
      selectedAt: new Date(),
    },
    create: {
      playlistItemId: item.id,
      provider: SPOTIFY_PROVIDER,
      status: 'SKIPPED',
      selectedAt: new Date(),
    },
  })

  return mapSavedTrackMatch(savedMatch)
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
    .filter((item) => item.isIncluded)
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id))
  const allMatches = await prisma.trackMatch.findMany({
    where: {
      playlistItemId: { in: itemIds },
      provider: SPOTIFY_PROVIDER,
    },
  })
  const resolvedItemIds = new Set(
    allMatches
      .filter((match) =>
        ['MATCHED', 'MANUALLY_MATCHED', 'SKIPPED'].includes(match.status),
      )
      .map((match) => match.playlistItemId),
  )

  const unresolvedCount = itemIds.filter(
    (itemId) => !resolvedItemIds.has(itemId),
  ).length

  if (unresolvedCount > 0) {
    throw new UnresolvedTrackMatchesError(unresolvedCount)
  }

  const matches = await prisma.trackMatch.findMany({
    where: {
      playlistItemId: { in: itemIds },
      provider: SPOTIFY_PROVIDER,
      status: { in: ['MATCHED', 'MANUALLY_MATCHED'] },
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
