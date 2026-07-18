import { prisma } from '@/db'
import { Prisma } from '@/generated/prisma/client'
import {
  generatedPlaylistDtoSchema,
  savedPlaylistDtoSchema,
  savedPlaylistSummaryDtoSchema,
} from '@/server/contracts/playlists'
import {
  DuplicateSavedPlaylistError,
  PlaylistNotFoundError,
} from '@/server/errors'
import type {
  GeneratedPlaylistDto,
  PlaylistItemDto,
  SavePlaylistModeDto,
} from '@/server/contracts/playlists'

type PlaylistWithRelations = Awaited<ReturnType<typeof findUserPlaylistById>>

function getStringArrayProperty(value: unknown, property: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  const propertyValue = (value as Record<string, unknown>)[property]

  if (!Array.isArray(propertyValue)) return []

  return propertyValue.filter(
    (item): item is string => typeof item === 'string',
  )
}

function mapPlaylistItem(item: {
  id: string
  position: number
  songTitle: string
  normalizedSongTitle: string
  isCover: boolean
  originalArtistName: string | null
  originalArtistMbid: string | null
  confidenceScore: number
  weightedScore: number
  appearanceCount: number
  totalSetlistsConsidered: number
  lastPlayedAt: Date | null
  evidence: unknown
}): PlaylistItemDto {
  return {
    id: item.id,
    position: item.position,
    songTitle: item.songTitle,
    normalizedSongTitle: item.normalizedSongTitle,
    isCover: item.isCover,
    originalArtistName: item.originalArtistName,
    originalArtistMbid: item.originalArtistMbid,
    confidenceScore: item.confidenceScore,
    weightedScore: item.weightedScore,
    appearanceCount: item.appearanceCount,
    totalSetlistsConsidered: item.totalSetlistsConsidered,
    lastPlayedAt: item.lastPlayedAt,
    evidence: {
      setlistfmIds: getStringArrayProperty(item.evidence, 'setlistfmIds'),
      playedAt: getStringArrayProperty(item.evidence, 'playedAt'),
    },
  }
}

function mapPlaylistSummary(playlist: NonNullable<PlaylistWithRelations>) {
  return savedPlaylistSummaryDtoSchema.parse({
    id: playlist.id,
    artist: {
      mbid: playlist.artist.mbid,
      name: playlist.artist.name,
      sortName: playlist.artist.sortName,
      disambiguation: playlist.artist.disambiguation,
      setlistfmUrl: playlist.artist.setlistfmUrl,
    },
    status: playlist.status,
    name: playlist.name,
    description: playlist.description,
    scoringVersion: playlist.scoringVersion,
    recentSetlistCount: playlist.recentSetlistCount,
    generatedAt: playlist.generatedAt,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    itemCount: playlist.items.length,
  })
}

function mapPlaylistDetail(playlist: NonNullable<PlaylistWithRelations>) {
  return savedPlaylistDtoSchema.parse({
    ...mapPlaylistSummary(playlist),
    items: playlist.items.map(mapPlaylistItem),
  })
}

async function findUserPlaylistById(userId: string, playlistId: string) {
  return prisma.playlist.findFirst({
    where: { id: playlistId, userId },
    include: {
      artist: true,
      items: {
        orderBy: { position: 'asc' },
      },
    },
  })
}

export async function saveGeneratedPlaylist(
  userId: string,
  playlist: GeneratedPlaylistDto,
  mode: SavePlaylistModeDto = 'create',
) {
  const validatedPlaylist = generatedPlaylistDtoSchema.parse(playlist)

  try {
    const savedPlaylist = await prisma.$transaction(async (tx) => {
      const artist = await tx.artist.upsert({
        where: { mbid: validatedPlaylist.artist.mbid },
        update: {
          name: validatedPlaylist.artist.name,
          sortName: validatedPlaylist.artist.sortName,
          disambiguation: validatedPlaylist.artist.disambiguation,
          setlistfmUrl: validatedPlaylist.artist.setlistfmUrl,
        },
        create: {
          mbid: validatedPlaylist.artist.mbid,
          name: validatedPlaylist.artist.name,
          sortName: validatedPlaylist.artist.sortName,
          disambiguation: validatedPlaylist.artist.disambiguation,
          setlistfmUrl: validatedPlaylist.artist.setlistfmUrl,
        },
      })

      const existingPlaylist = await tx.playlist.findFirst({
        where: {
          userId,
          artistId: artist.id,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })

      if (existingPlaylist && mode !== 'replace') {
        throw new DuplicateSavedPlaylistError(validatedPlaylist.artist.mbid)
      }

      if (existingPlaylist) {
        await tx.playlist.update({
          where: { id: existingPlaylist.id },
          data: {
            status: 'DRAFT',
            name: validatedPlaylist.name,
            description: validatedPlaylist.description,
            scoringVersion: validatedPlaylist.scoringVersion,
            recentSetlistCount: validatedPlaylist.recentSetlistCount,
            generatedAt: validatedPlaylist.generatedAt,
            generationSettings: getGenerationSettings(),
            items: {
              deleteMany: {},
              create: getPlaylistItemCreateData(validatedPlaylist),
            },
          },
        })

        return tx.playlist.findFirstOrThrow({
          where: { id: existingPlaylist.id, userId },
          include: {
            artist: true,
            items: {
              orderBy: { position: 'asc' },
            },
          },
        })
      }

      const createdPlaylist = await tx.playlist.create({
        data: {
          userId,
          artistId: artist.id,
          name: validatedPlaylist.name,
          description: validatedPlaylist.description,
          scoringVersion: validatedPlaylist.scoringVersion,
          recentSetlistCount: validatedPlaylist.recentSetlistCount,
          generatedAt: validatedPlaylist.generatedAt,
          generationSettings: getGenerationSettings(),
          items: {
            create: getPlaylistItemCreateData(validatedPlaylist),
          },
        },
      })

      return tx.playlist.findFirstOrThrow({
        where: { id: createdPlaylist.id, userId },
        include: {
          artist: true,
          items: {
            orderBy: { position: 'asc' },
          },
        },
      })
    })

    return mapPlaylistDetail(savedPlaylist)
  } catch (error) {
    if (isPlaylistArtistUniquenessError(error)) {
      throw new DuplicateSavedPlaylistError(validatedPlaylist.artist.mbid)
    }

    throw error
  }
}

function isPlaylistArtistUniquenessError(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false
  }

  const target = error.meta?.target

  return (
    Array.isArray(target) &&
    target.includes('userId') &&
    target.includes('artistId')
  )
}

function getGenerationSettings() {
  return {
    source: 'setlistfm',
    limit: 25,
  }
}

function getPlaylistItemCreateData(playlist: GeneratedPlaylistDto) {
  return playlist.items.map((item) => ({
    position: item.position,
    songTitle: item.songTitle,
    normalizedSongTitle: item.normalizedSongTitle,
    isCover: item.isCover,
    originalArtistName: item.originalArtistName,
    originalArtistMbid: item.originalArtistMbid,
    confidenceScore: item.confidenceScore,
    weightedScore: item.weightedScore,
    appearanceCount: item.appearanceCount,
    totalSetlistsConsidered: item.totalSetlistsConsidered,
    lastPlayedAt: item.lastPlayedAt,
    evidence: item.evidence,
  }))
}

export async function listUserPlaylists(userId: string) {
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: {
      artist: true,
      items: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return playlists.map(mapPlaylistSummary)
}

export async function getUserPlaylist(userId: string, playlistId: string) {
  const playlist = await findUserPlaylistById(userId, playlistId)

  if (!playlist) return null

  return mapPlaylistDetail(playlist)
}

export async function deleteUserPlaylist(userId: string, playlistId: string) {
  const result = await prisma.playlist.deleteMany({
    where: { id: playlistId, userId },
  })

  if (result.count === 0) {
    throw new PlaylistNotFoundError()
  }

  return { playlistId }
}
