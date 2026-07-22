import { generatedPlaylistDtoSchema } from '@/server/contracts/playlists'
import type { ArtistDto } from '@/server/contracts/artists'
import type {
  GeneratedPlaylistDto,
  PlaylistItemDto,
} from '@/server/contracts/playlists'
import type { NormalizedSetlist } from '@/server/models/setlists'

const SCORING_VERSION = 'recent-weighted-v1'
const PLAYLIST_LIMIT = 25

interface SongAccumulator {
  songTitle: string
  normalizedSongTitle: string
  isCover: boolean
  originalArtistName: string | null
  originalArtistMbid: string | null
  weightedScore: number
  appearanceCount: number
  lastPlayedAt: Date | null
  setlistfmIds: Array<string>
  playedAt: Array<string>
}

function normalizeSongTitle(songTitle: string) {
  return songTitle.trim().toLocaleLowerCase()
}

export function scoreSetlistsForArtist(
  artist: ArtistDto,
  setlists: Array<NormalizedSetlist>,
): GeneratedPlaylistDto {
  const sortedSetlists = [...setlists].sort(
    (left, right) => right.eventDate.getTime() - left.eventDate.getTime(),
  )
  const totalSetlistWeight = sortedSetlists.reduce(
    (total, _setlist, index) => total + sortedSetlists.length - index,
    0,
  )
  const songs = new Map<string, SongAccumulator>()

  sortedSetlists.forEach((setlist, index) => {
    const weight = sortedSetlists.length - index
    const songsSeenInSetlist = new Set<string>()

    for (const song of setlist.songs) {
      const normalizedSongTitle = normalizeSongTitle(song.title)

      if (songsSeenInSetlist.has(normalizedSongTitle)) continue

      songsSeenInSetlist.add(normalizedSongTitle)

      const existing = songs.get(normalizedSongTitle)
      const next: SongAccumulator = existing ?? {
        songTitle: song.title,
        normalizedSongTitle,
        isCover: song.isCover,
        originalArtistName: song.originalArtistName,
        originalArtistMbid: song.originalArtistMbid,
        weightedScore: 0,
        appearanceCount: 0,
        lastPlayedAt: null,
        setlistfmIds: [],
        playedAt: [],
      }

      next.weightedScore += weight
      next.appearanceCount += 1
      next.setlistfmIds.push(setlist.setlistfmId)
      next.playedAt.push(setlist.eventDateLabel)

      if (!next.lastPlayedAt || setlist.eventDate > next.lastPlayedAt) {
        next.lastPlayedAt = setlist.eventDate
      }

      songs.set(normalizedSongTitle, next)
    }
  })

  const items = [...songs.values()]
    .sort((left, right) => {
      const leftConfidence =
        totalSetlistWeight === 0 ? 0 : left.weightedScore / totalSetlistWeight
      const rightConfidence =
        totalSetlistWeight === 0 ? 0 : right.weightedScore / totalSetlistWeight

      if (rightConfidence !== leftConfidence) {
        return rightConfidence - leftConfidence
      }

      if (right.appearanceCount !== left.appearanceCount) {
        return right.appearanceCount - left.appearanceCount
      }

      return (
        (right.lastPlayedAt?.getTime() ?? 0) -
        (left.lastPlayedAt?.getTime() ?? 0)
      )
    })
    .slice(0, PLAYLIST_LIMIT)
    .map<PlaylistItemDto>((song, index) => ({
      position: index + 1,
      songTitle: song.songTitle,
      normalizedSongTitle: song.normalizedSongTitle,
      isIncluded: true,
      isCover: song.isCover,
      originalArtistName: song.originalArtistName,
      originalArtistMbid: song.originalArtistMbid,
      confidenceScore:
        totalSetlistWeight === 0
          ? 0
          : Math.round((song.weightedScore / totalSetlistWeight) * 100),
      weightedScore: song.weightedScore,
      appearanceCount: song.appearanceCount,
      totalSetlistsConsidered: sortedSetlists.length,
      lastPlayedAt: song.lastPlayedAt,
      evidence: {
        setlistfmIds: song.setlistfmIds,
        playedAt: song.playedAt,
      },
    }))

  return generatedPlaylistDtoSchema.parse({
    artist,
    name: `${artist.name} recent setlist`,
    description:
      sortedSetlists.length === 0
        ? null
        : `Generated from ${sortedSetlists.length} recent setlists.`,
    scoringVersion: SCORING_VERSION,
    recentSetlistCount: sortedSetlists.length,
    generatedAt: new Date(),
    items,
  })
}
