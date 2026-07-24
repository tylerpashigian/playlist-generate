import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteUserPlaylist,
  refreshUserPlaylist,
  saveGeneratedPlaylist,
} from './playlists'
import {
  DuplicateSavedPlaylistError,
  PlaylistNotFoundError,
} from '@/server/errors'
import { Prisma } from '@/generated/prisma/client'
import type { GeneratedPlaylistDto } from '@/server/contracts/playlists'

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  artistUpsert: vi.fn(),
  playlistCreate: vi.fn(),
  playlistFindFirst: vi.fn(),
  playlistFindFirstOrThrow: vi.fn(),
  playlistUpdate: vi.fn(),
  playlistDeleteMany: vi.fn(),
  playlistItemUpdateMany: vi.fn(),
  playlistItemUpdate: vi.fn(),
  playlistItemCreate: vi.fn(),
  playlistItemDeleteMany: vi.fn(),
  fetchRecentSetlistsForArtist: vi.fn(),
  scoreSetlistsForArtist: vi.fn(),
}))

vi.mock('@/server/providers/setlistfm/client', () => ({
  fetchRecentSetlistsForArtist: prismaMocks.fetchRecentSetlistsForArtist,
}))

vi.mock('@/server/services/scoring', () => ({
  scoreSetlistsForArtist: prismaMocks.scoreSetlistsForArtist,
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
      deleteMany: prismaMocks.playlistDeleteMany,
    },
    playlistItem: {
      updateMany: prismaMocks.playlistItemUpdateMany,
      update: prismaMocks.playlistItemUpdate,
      create: prismaMocks.playlistItemCreate,
      deleteMany: prismaMocks.playlistItemDeleteMany,
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
      isIncluded: true,
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
        isIncluded: true,
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
        playlistItem: {
          updateMany: prismaMocks.playlistItemUpdateMany,
          update: prismaMocks.playlistItemUpdate,
          create: prismaMocks.playlistItemCreate,
          deleteMany: prismaMocks.playlistItemDeleteMany,
        },
      }),
    )
    prismaMocks.artistUpsert.mockResolvedValue(artistRecord)
    prismaMocks.playlistCreate.mockResolvedValue({ id: 'created-playlist-id' })
    prismaMocks.playlistFindFirstOrThrow.mockResolvedValue(
      savedPlaylistRecord('created-playlist-id'),
    )
    prismaMocks.fetchRecentSetlistsForArtist.mockResolvedValue([])
    prismaMocks.scoreSetlistsForArtist.mockReturnValue(generatedPlaylist)
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
    prismaMocks.playlistFindFirst
      .mockResolvedValueOnce({ id: 'existing-id' })
      .mockResolvedValueOnce(savedPlaylistRecord('existing-id'))
    prismaMocks.playlistFindFirstOrThrow.mockResolvedValue(
      savedPlaylistRecord('existing-id'),
    )

    await expect(
      saveGeneratedPlaylist('user-id', generatedPlaylist, 'replace'),
    ).resolves.toMatchObject({
      id: 'existing-id',
      items: [expect.objectContaining({ songTitle: 'Song' })],
    })

    expect(prismaMocks.playlistItemUpdateMany).toHaveBeenCalledWith({
      where: { playlistId: 'existing-id' },
      data: { position: { increment: 3 } },
    })
    expect(prismaMocks.playlistItemUpdate).toHaveBeenCalledWith({
      where: { id: 'playlist-item-id' },
      data: expect.objectContaining({
        songTitle: 'Song',
        normalizedSongTitle: 'song',
        isIncluded: true,
      }),
    })
    expect(prismaMocks.playlistUpdate).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: expect.objectContaining({
        status: 'DRAFT',
        name: generatedPlaylist.name,
      }),
    })
  })

  it('refreshes in place while preserving retained curation and removing stale items', async () => {
    const existingPlaylist = savedPlaylistRecord('existing-id')
    existingPlaylist.items[0].isIncluded = false
    existingPlaylist.items.push({
      ...existingPlaylist.items[0],
      id: 'removed-item-id',
      position: 2,
      songTitle: 'Removed song',
      normalizedSongTitle: 'removed song',
    })
    const refreshedPlaylist = {
      ...generatedPlaylist,
      generatedAt: new Date('2026-07-01T12:00:00.000Z'),
      items: [
        { ...generatedPlaylist.items[0], position: 2, confidenceScore: 80 },
        {
          ...generatedPlaylist.items[0],
          position: 1,
          songTitle: 'New song',
          normalizedSongTitle: 'new song',
        },
      ],
    }
    const refreshedRecord = {
      ...existingPlaylist,
      generatedAt: refreshedPlaylist.generatedAt,
      items: [
        {
          ...existingPlaylist.items[0],
          position: 2,
          confidenceScore: 80,
          isIncluded: false,
        },
        {
          ...existingPlaylist.items[0],
          id: 'new-item-id',
          position: 1,
          songTitle: 'New song',
          normalizedSongTitle: 'new song',
          isIncluded: true,
        },
      ],
    }
    prismaMocks.playlistFindFirst
      .mockResolvedValueOnce(existingPlaylist)
      .mockResolvedValueOnce(existingPlaylist)
    prismaMocks.scoreSetlistsForArtist.mockReturnValue(refreshedPlaylist)
    prismaMocks.playlistFindFirstOrThrow.mockResolvedValue(refreshedRecord)

    await expect(
      refreshUserPlaylist('user-id', 'existing-id'),
    ).resolves.toMatchObject({
      id: 'existing-id',
      items: [
        expect.objectContaining({ normalizedSongTitle: 'song', isIncluded: false }),
        expect.objectContaining({ normalizedSongTitle: 'new song', isIncluded: true }),
      ],
    })

    expect(prismaMocks.fetchRecentSetlistsForArtist).toHaveBeenCalledWith(
      expect.objectContaining({ mbid: 'artist-mbid' }),
    )
    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1)
    expect(prismaMocks.playlistItemUpdate).toHaveBeenCalledWith({
      where: { id: 'playlist-item-id' },
      data: expect.objectContaining({ isIncluded: false, position: 2 }),
    })
    expect(prismaMocks.playlistItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        playlistId: 'existing-id',
        normalizedSongTitle: 'new song',
        isIncluded: true,
      }),
    })
    expect(prismaMocks.playlistItemDeleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['removed-item-id'] },
        playlistId: 'existing-id',
      },
    })
  })

  it('does not open a transaction when fetching fresh setlists fails', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue(
      savedPlaylistRecord('existing-id'),
    )
    prismaMocks.fetchRecentSetlistsForArtist.mockRejectedValue(
      new Error('Setlist.fm unavailable'),
    )

    await expect(
      refreshUserPlaylist('user-id', 'existing-id'),
    ).rejects.toThrow('Setlist.fm unavailable')

    expect(prismaMocks.transaction).not.toHaveBeenCalled()
  })

  it('does not reveal missing or non-owned playlists when refreshing', async () => {
    prismaMocks.playlistFindFirst.mockResolvedValue(null)

    await expect(
      refreshUserPlaylist('user-id', 'other-user-playlist-id'),
    ).rejects.toBeInstanceOf(PlaylistNotFoundError)
    expect(prismaMocks.fetchRecentSetlistsForArtist).not.toHaveBeenCalled()
  })

  it('deletes only the authenticated user playlist', async () => {
    prismaMocks.playlistDeleteMany.mockResolvedValue({ count: 1 })

    await expect(
      deleteUserPlaylist('user-id', 'playlist-id'),
    ).resolves.toEqual({ playlistId: 'playlist-id' })

    expect(prismaMocks.playlistDeleteMany).toHaveBeenCalledWith({
      where: { id: 'playlist-id', userId: 'user-id' },
    })
  })

  it('does not reveal missing or non-owned playlists when deleting', async () => {
    prismaMocks.playlistDeleteMany.mockResolvedValue({ count: 0 })

    await expect(
      deleteUserPlaylist('user-id', 'other-user-playlist-id'),
    ).rejects.toBeInstanceOf(PlaylistNotFoundError)
  })
})
