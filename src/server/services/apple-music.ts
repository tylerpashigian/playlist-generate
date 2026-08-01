import { prisma } from '@/db'
import { appleMusicTrackCandidateDtoSchema } from '@/server/contracts/apple-music'
import {
  exportPlaylistDtoSchema,
  trackMatchDtoSchema,
} from '@/server/contracts/streaming'
import {
  NoMatchedTracksError,
  PlaylistItemNotFoundError,
  UnresolvedTrackMatchesError,
} from '@/server/errors'
import {
  createAppleMusicPlaylist,
  getAppleMusicSong,
  searchAppleMusicSongs,
} from '@/server/providers/apple-music/client'
import { getAppleMusicAccess } from './apple-music-connection'
import { toTrackMatchDto } from './streaming-track-matches'
import type { SavedPlaylistDto } from '@/server/contracts/playlists'
import type {
  AppleMusicTrackCandidateDto,
  SearchAppleMusicTracksInput,
  SelectAppleMusicTrackInput,
} from '@/server/contracts/apple-music'
import type { TrackMatchDto } from '@/server/contracts/streaming'
import type { AppleMusicSong } from '@/server/providers/apple-music/schemas'

const APPLE_MUSIC_PROVIDER = 'APPLE_MUSIC' as const
const MATCH_THRESHOLD = 70

function getSearchQuery(
  playlist: SavedPlaylistDto,
  item: SavedPlaylistDto['items'][number],
  useCoverArtist: boolean,
) {
  const artistName =
    useCoverArtist && item.originalArtistName
      ? item.originalArtistName
      : playlist.artist.name
  return `${item.songTitle} ${artistName}`
}

function getMatchScore(
  song: AppleMusicSong,
  item: SavedPlaylistDto['items'][number],
) {
  const title = song.attributes.name.toLocaleLowerCase()
  const expected = item.songTitle.toLocaleLowerCase()
  if (title === expected) return 100
  if (title.includes(expected) || expected.includes(title)) return 80
  return 50
}

function mapCandidate(song: AppleMusicSong): AppleMusicTrackCandidateDto {
  return appleMusicTrackCandidateDtoSchema.parse({
    id: song.id,
    externalUrl: song.attributes.url ?? null,
    name: song.attributes.name,
    artistName: song.attributes.artistName,
    albumName: song.attributes.albumName ?? 'Unknown album',
    durationMs: song.attributes.durationInMillis ?? 0,
  })
}

function mapMatch(
  playlistItemId: string,
  song: AppleMusicSong | null,
  score: number | null,
): TrackMatchDto {
  return trackMatchDtoSchema.parse({
    playlistItemId,
    provider: APPLE_MUSIC_PROVIDER,
    status:
      song && score !== null
        ? score >= MATCH_THRESHOLD
          ? 'MATCHED'
          : 'LOW_CONFIDENCE'
        : 'UNRESOLVED',
    providerTrackId: song?.id ?? null,
    providerTrackUri: null,
    providerTrackUrl: song?.attributes.url ?? null,
    trackName: song?.attributes.name ?? null,
    artistName: song?.attributes.artistName ?? null,
    albumName: song?.attributes.albumName ?? null,
    durationMs: song?.attributes.durationInMillis ?? null,
    matchConfidenceScore: score,
  })
}

async function requireItem(
  userId: string,
  playlistId: string,
  playlistItemId: string,
) {
  const item = await prisma.playlistItem.findFirst({
    where: { id: playlistItemId, playlistId, playlist: { userId } },
  })
  if (!item || !item.isIncluded) throw new PlaylistItemNotFoundError()
  return item
}

export async function matchAppleMusicTracks(
  userId: string,
  connectionKey: string | null,
  playlist: SavedPlaylistDto,
) {
  const access = await getAppleMusicAccess(userId, connectionKey)
  const items = playlist.items.filter((item) => item.isIncluded && item.id)
  const preserved = await prisma.trackMatch.findMany({
    where: {
      playlistItemId: { in: items.map((item) => item.id as string) },
      provider: APPLE_MUSIC_PROVIDER,
      status: { in: ['MANUALLY_MATCHED', 'SKIPPED'] },
    },
  })
  const preservedByItem = new Map(
    preserved.map((match) => [match.playlistItemId, match]),
  )
  const matches: Array<TrackMatchDto> = []

  for (const item of items) {
    const itemId = item.id as string
    const existing = preservedByItem.get(itemId)
    if (existing) {
      matches.push(toTrackMatchDto(existing))
      continue
    }
    const queries = [
      getSearchQuery(playlist, item, false),
      ...(item.isCover ? [getSearchQuery(playlist, item, true)] : []),
    ]
    let song: AppleMusicSong | null = null
    let score: number | null = null
    for (const query of queries) {
      const result = await searchAppleMusicSongs(
        access,
        access.storefrontId,
        query,
      )
      const candidate = result.results.songs?.data[0]
      if (candidate) {
        song = candidate
        score = getMatchScore(candidate, item)
        break
      }
    }
    const match = mapMatch(itemId, song, score)
    const saved = await prisma.trackMatch.upsert({
      where: {
        playlistItemId_provider: {
          playlistItemId: itemId,
          provider: APPLE_MUSIC_PROVIDER,
        },
      },
      update: {
        status: match.status,
        providerTrackId: match.providerTrackId,
        providerTrackUri: null,
        providerTrackUrl: match.providerTrackUrl,
        trackName: match.trackName,
        artistName: match.artistName,
        albumName: match.albumName,
        durationMs: match.durationMs,
        matchConfidenceScore: match.matchConfidenceScore,
        selectedAt: match.status === 'MATCHED' ? new Date() : null,
      },
      create: {
        playlistItemId: itemId,
        provider: APPLE_MUSIC_PROVIDER,
        status: match.status,
        providerTrackId: match.providerTrackId,
        providerTrackUrl: match.providerTrackUrl,
        trackName: match.trackName,
        artistName: match.artistName,
        albumName: match.albumName,
        durationMs: match.durationMs,
        matchConfidenceScore: match.matchConfidenceScore,
        selectedAt: match.status === 'MATCHED' ? new Date() : null,
      },
    })
    matches.push(toTrackMatchDto(saved))
  }
  return matches
}

export async function getAppleMusicTrackMatches(
  userId: string,
  playlistId: string,
  connectionKey: string | null,
) {
  await getAppleMusicAccess(userId, connectionKey)
  await prisma.playlist.findFirstOrThrow({
    where: { id: playlistId, userId },
    select: { id: true },
  })
  const matches = await prisma.trackMatch.findMany({
    where: { provider: APPLE_MUSIC_PROVIDER, playlistItem: { playlistId } },
    orderBy: { playlistItem: { position: 'asc' } },
  })
  return matches.map(toTrackMatchDto)
}

export async function searchAppleMusicTrackCandidates(
  userId: string,
  connectionKey: string | null,
  input: SearchAppleMusicTracksInput,
) {
  await requireItem(userId, input.playlistId, input.playlistItemId)
  const access = await getAppleMusicAccess(userId, connectionKey)
  const results = await searchAppleMusicSongs(
    access,
    access.storefrontId,
    input.query,
  )
  return (results.results.songs?.data ?? []).map(mapCandidate)
}

export async function selectAppleMusicTrackMatch(
  userId: string,
  connectionKey: string | null,
  input: SelectAppleMusicTrackInput,
) {
  const item = await requireItem(userId, input.playlistId, input.playlistItemId)
  const access = await getAppleMusicAccess(userId, connectionKey)
  const song = await getAppleMusicSong(
    access,
    access.storefrontId,
    input.appleMusicTrackId,
  )
  const saved = await prisma.trackMatch.upsert({
    where: {
      playlistItemId_provider: {
        playlistItemId: item.id,
        provider: APPLE_MUSIC_PROVIDER,
      },
    },
    update: {
      status: 'MANUALLY_MATCHED',
      providerTrackId: song.id,
      providerTrackUri: null,
      providerTrackUrl: song.attributes.url ?? null,
      trackName: song.attributes.name,
      artistName: song.attributes.artistName,
      albumName: song.attributes.albumName ?? null,
      durationMs: song.attributes.durationInMillis ?? null,
      matchConfidenceScore: null,
      selectedAt: new Date(),
    },
    create: {
      playlistItemId: item.id,
      provider: APPLE_MUSIC_PROVIDER,
      status: 'MANUALLY_MATCHED',
      providerTrackId: song.id,
      providerTrackUrl: song.attributes.url ?? null,
      trackName: song.attributes.name,
      artistName: song.attributes.artistName,
      albumName: song.attributes.albumName ?? null,
      durationMs: song.attributes.durationInMillis ?? null,
      selectedAt: new Date(),
    },
  })
  return toTrackMatchDto(saved)
}

export async function skipAppleMusicTrackMatch(
  userId: string,
  connectionKey: string | null,
  input: { playlistId: string; playlistItemId: string },
) {
  await getAppleMusicAccess(userId, connectionKey)
  const item = await requireItem(userId, input.playlistId, input.playlistItemId)
  const saved = await prisma.trackMatch.upsert({
    where: {
      playlistItemId_provider: {
        playlistItemId: item.id,
        provider: APPLE_MUSIC_PROVIDER,
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
      provider: APPLE_MUSIC_PROVIDER,
      status: 'SKIPPED',
      selectedAt: new Date(),
    },
  })
  return toTrackMatchDto(saved)
}

export async function exportAppleMusicPlaylist(
  userId: string,
  connectionKey: string | null,
  playlist: SavedPlaylistDto,
  name?: string,
) {
  const itemIds = playlist.items
    .filter((item) => item.isIncluded)
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id))
  const allMatches = await prisma.trackMatch.findMany({
    where: { playlistItemId: { in: itemIds }, provider: APPLE_MUSIC_PROVIDER },
    orderBy: { playlistItem: { position: 'asc' } },
  })
  const resolved = new Set(
    allMatches
      .filter((match) =>
        ['MATCHED', 'MANUALLY_MATCHED', 'SKIPPED'].includes(match.status),
      )
      .map((match) => match.playlistItemId),
  )
  const unresolvedCount = itemIds.filter((id) => !resolved.has(id)).length
  if (unresolvedCount) throw new UnresolvedTrackMatchesError(unresolvedCount)
  const songIds = allMatches
    .filter(
      (match) =>
        ['MATCHED', 'MANUALLY_MATCHED'].includes(match.status) &&
        match.providerTrackId,
    )
    .map((match) => match.providerTrackId as string)
  if (!songIds.length) throw new NoMatchedTracksError()
  const access = await getAppleMusicAccess(userId, connectionKey)
  const created = await createAppleMusicPlaylist(access, {
    name: name ?? playlist.name,
    description: playlist.description,
    songIds,
  })
  const remote = created.data[0]
  const external = await prisma.externalPlaylist.upsert({
    where: {
      playlistId_provider: {
        playlistId: playlist.id,
        provider: APPLE_MUSIC_PROVIDER,
      },
    },
    update: {
      providerPlaylistId: remote.id,
      url: remote.attributes.url ?? null,
      snapshotId: null,
      exportedAt: new Date(),
    },
    create: {
      playlistId: playlist.id,
      provider: APPLE_MUSIC_PROVIDER,
      providerPlaylistId: remote.id,
      url: remote.attributes.url ?? null,
      snapshotId: null,
    },
  })
  await prisma.playlist.update({
    where: { id: playlist.id },
    data: { status: 'EXPORTED' },
  })
  return exportPlaylistDtoSchema.parse({
    provider: external.provider,
    providerPlaylistId: external.providerPlaylistId,
    url: external.url,
    snapshotId: null,
    exportedAt: external.exportedAt,
    exportedTrackCount: songIds.length,
  })
}
