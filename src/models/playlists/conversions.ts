import { toArtist, toArtistDto } from '../artists/conversions'
import type {
  GeneratedPlaylistDto,
  PlaylistItemDto,
  SavedPlaylistDto,
  SavedPlaylistSummaryDto,
} from '@/server/contracts/playlists'
import type {
  GeneratedPlaylist,
  PlaylistTrack,
  SavedPlaylist,
  SavedPlaylistSummary,
} from './models'

export function toPlaylistTrack(dto: PlaylistItemDto): PlaylistTrack {
  return {
    id: dto.id,
    position: dto.position,
    title: dto.songTitle,
    normalizedTitle: dto.normalizedSongTitle,
    isIncluded: dto.isIncluded,
    isCover: dto.isCover,
    originalArtistName: dto.originalArtistName,
    originalArtistMbid: dto.originalArtistMbid,
    confidenceScore: dto.confidenceScore,
    weightedScore: dto.weightedScore,
    appearanceCount: dto.appearanceCount,
    totalSetlistsConsidered: dto.totalSetlistsConsidered,
    lastPlayedAt: dto.lastPlayedAt,
    evidence: dto.evidence,
  }
}

export function toPlaylistItemDto(track: PlaylistTrack): PlaylistItemDto {
  return {
    id: track.id,
    position: track.position,
    songTitle: track.title,
    normalizedSongTitle: track.normalizedTitle,
    isIncluded: track.isIncluded,
    isCover: track.isCover,
    originalArtistName: track.originalArtistName,
    originalArtistMbid: track.originalArtistMbid,
    confidenceScore: track.confidenceScore,
    weightedScore: track.weightedScore,
    appearanceCount: track.appearanceCount,
    totalSetlistsConsidered: track.totalSetlistsConsidered,
    lastPlayedAt: track.lastPlayedAt,
    evidence: track.evidence,
  }
}

export function toGeneratedPlaylist(
  dto: GeneratedPlaylistDto,
): GeneratedPlaylist {
  return {
    artist: toArtist(dto.artist),
    name: dto.name,
    description: dto.description,
    scoringVersion: dto.scoringVersion,
    recentSetlistCount: dto.recentSetlistCount,
    generatedAt: dto.generatedAt,
    tracks: dto.items.map(toPlaylistTrack),
  }
}

export function toGeneratedPlaylistDto(
  playlist: GeneratedPlaylist,
): GeneratedPlaylistDto {
  return {
    artist: toArtistDto(playlist.artist),
    name: playlist.name,
    description: playlist.description,
    scoringVersion: playlist.scoringVersion,
    recentSetlistCount: playlist.recentSetlistCount,
    generatedAt: playlist.generatedAt,
    items: playlist.tracks.map(toPlaylistItemDto),
  }
}

export function toSavedPlaylistSummary(
  dto: SavedPlaylistSummaryDto,
): SavedPlaylistSummary {
  return {
    id: dto.id,
    artist: toArtist(dto.artist),
    status: dto.status,
    name: dto.name,
    description: dto.description,
    scoringVersion: dto.scoringVersion,
    recentSetlistCount: dto.recentSetlistCount,
    generatedAt: dto.generatedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    trackCount: dto.itemCount,
  }
}

export function toSavedPlaylist(dto: SavedPlaylistDto): SavedPlaylist {
  return {
    ...toSavedPlaylistSummary(dto),
    tracks: dto.items.map(toPlaylistTrack),
  }
}
