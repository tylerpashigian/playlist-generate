import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveGeneratedPlaylist } from './playlists'
import { DuplicateSavedPlaylistError } from '@/server/errors'
import { Prisma } from '@/generated/prisma/client'
import type { GeneratedPlaylistDto } from '@/server/contracts/playlists'

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  artistUpsert: vi.fn(),
  playlistCreate: vi.fn(),
  playlistFindFirst: vi.fn(),
  playlistFindFirstOrThrow: vi.fn(),
  playlistUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
    artist: {
      upsert: prismaMocks.artistUpsert,
    },
    playlist: {
      create: prismaMocks.playlistCreate,
      findFirst: prismaMocks.playlistFindFirst,
      findFirstOrThrow: prismaMocks.playlistFindFirstOrThrow,
      update: prismaMocks.playlistUpdate,
    },
  },
}))

const generatedAt = new Date('2026-06-01T12:00:00.000Z')
const generatedPlaylist: GeneratedPlaylistDto = {
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
  recentSetlistCount: 10,
  generatedAt,
  items: [
    {
      position: 1,
      songTitle: 'Song',
      normalizedSongTitle: 'song',
      isCover: false,
      originalArtistName: null,
      originalArtistMbid: null,
      confidenceScore: 100,
      weightedScore: 10,
      appearanceCount: 10,
      totalSetlistsConsidered: 10,
      lastPlayedAt: generatedAt,
      evidence: {
        setlistfmIds: ['setlist-1'],
        playedAt: ['2026-06-01'],
      },
    },
  ],
}

const artistRecord = {
  id: 'artist-id',
  mbid: 'artist-mbid',
  name: 'Artist',
  sortName: null,
  disambiguation: null,
  setlistfmUrl: null,
}

function savedPlaylistRecord(id = 'playlist-id') {
  return {
    id,
    artist: artistRecord,
    status: 'DRAFT',
    name: generatedPlaylist.name,
    description: generatedPlaylist.description,
    scoringVersion: generatedPlaylist.scoringVersion,
    recentSetlistCount: generatedPlaylist.recentSetlistCount,
    generatedAt: generatedPlaylist.generatedAt,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    items: [
      {
        id: 'playlist-item-id',
        position: 1,
        songTitle: 'Song',
        normalizedSongTitle: 'song',
        isCover: false,
        originalArtistName: null,
        originalArtistMbid: null,
        confidenceScore: 100,
        weightedScore: 10,
        appearanceCount: 10,
        totalSetlistsConsidered: 10,
        lastPlayedAt: generatedAt,
        evidence: {
          setlistfmIds: ['setlist-1'],
          playedAt: ['2026-06-01'],
        },
      },
    ],
  }
}

describe('playlist service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMocks.transaction.mockImplementation((callback) =>
      callback({
        artist: {
          upsert: prismaMocks.artistUpsert,
        },
        playlist: {
          create: prismaMocks.playlistCreate,
          findFirst: prismaMocks.playlistFindFirst,
          findFirstOrThrow: prismaMocks.playlistFindFirstOrThrow,
          update: prismaMocks.playlistUpdate,
        },
      }),
    )
    prismaMocks.artistUpsert.mockResolvedValue(artistRecord)
    prismaMocks.playlistCreate.mockResolvedValue({ id: 'created-playlist-id' })
    prismaMocks.playlistFindFirstOrThrow.mockResolvedValue(
      savedPlaylistRecord('created-playlist-id'),
    )
  })

  it('creates a playlist when no saved playlist exists for the artist', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue(null)

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist),
    ).resolves.toMatchObject({
      id: 'created-playlist-id',
      artist: expect.objectContaining({ mbid: 'artist-mbid' }),
      items: [expect.objectContaining({ songTitle: 'Song' })],
    })

    expect(prismaMocks.playlistFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        artistId: 'artist-id',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    expect(prismaMocks.playlistCreate).toHaveBeenCalled()
  })

  it('rejects create mode when a saved playlist exists for the artist', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue({ id: 'existing-id' })

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist),
    ).rejects.toBeInstanceOf(DuplicateSavedPlaylistError)

    expect(prismaMocks.playlistCreate).not.toHaveBeenCalled()
    expect(prismaMocks.playlistUpdate).not.toHaveBeenCalled()
  })

  it('converts a concurrent create unique violation into a duplicate error', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue(null)
    prismaMocks.playlistCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['userId', 'artistId'] },
      }),
    )

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist),
    ).rejects.toBeInstanceOf(DuplicateSavedPlaylistError)
  })

  it('does not translate an unrelated unique violation', async () => {
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['playlistId', 'position'] },
      },
    )
    prismaMocks.playlistFindFirst.mockResolvedValue(null)
    prismaMocks.playlistCreate.mockRejectedValue(uniqueViolation)

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist),
    ).rejects.toBe(uniqueViolation)
  })

  it('replaces the newest existing playlist in place when replace mode is used', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue({ id: 'existing-id' })
    prismaMocks.playlistFindFirstOrThrow.mockResolvedValue(
      savedPlaylistRecord('existing-id'),
    )

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist, 'replace'),
    ).resolves.toMatchObject({
      id: 'existing-id',
      items: [expect.objectContaining({ songTitle: 'Song' })],
    })

    expect(prismaMocks.playlistUpdate).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: expect.objectContaining({
        status: 'DRAFT',
        name: generatedPlaylist.name,
        items: expect.objectContaining({
          deleteMany: {},
          create: [
            expect.objectContaining({
              songTitle: 'Song',
              normalizedSongTitle: 'song',
            }),
          ],
        }),
      }),
    })
  })
})
