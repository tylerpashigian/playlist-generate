import { toStreamingTrackCandidate } from '@/models/spotify/conversions'
import {
  toPlaylistExportResult,
  toTrackMatch,
} from '@/models/streaming/conversions'
import { trpcClient } from '@/lib/trpc-client'
import type {
  PlaylistExportResult,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'
import type {
  SearchSpotifyTracksInput,
  SelectSpotifyTrackInput,
  SpotifyPlaylistItemInput,
  SpotifyTrackCandidateDto,
} from '@/server/contracts/spotify'
import type {
  ExportPlaylistDto,
  ExportPlaylistInput,
  MatchTracksInput,
  TrackMatchDto,
} from '@/server/contracts/streaming'

export async function matchPlaylistTracks(
  playlistId: string,
): Promise<Array<TrackMatch>> {
  const input: MatchTracksInput = { playlistId }
  const matches: Array<TrackMatchDto> =
    await trpcClient.spotify.matchTracks.mutate(input)

  return matches.map(toTrackMatch)
}

export async function getSpotifyTrackMatches(
  playlistId: string,
): Promise<Array<TrackMatch>> {
  const input: MatchTracksInput = { playlistId }
  const matches: Array<TrackMatchDto> =
    await trpcClient.spotify.matches.query(input)

  return matches.map(toTrackMatch)
}

export async function searchSpotifyTrackCandidates(
  input: SearchSpotifyTracksInput,
): Promise<Array<StreamingTrackCandidate>> {
  const candidates: Array<SpotifyTrackCandidateDto> =
    await trpcClient.spotify.searchTracks.mutate(input)

  return candidates.map(toStreamingTrackCandidate)
}

export async function selectSpotifyTrack(
  input: SelectSpotifyTrackInput,
): Promise<TrackMatch> {
  const match: TrackMatchDto =
    await trpcClient.spotify.selectTrack.mutate(input)

  return toTrackMatch(match)
}

export async function skipSpotifyTrack(
  input: SpotifyPlaylistItemInput,
): Promise<TrackMatch> {
  const match: TrackMatchDto = await trpcClient.spotify.skipTrack.mutate(input)

  return toTrackMatch(match)
}

export async function exportPlaylistToSpotify(input: {
  playlistId: string
  name?: string
}): Promise<PlaylistExportResult> {
  const exportInput: ExportPlaylistInput = input
  const result: ExportPlaylistDto =
    await trpcClient.spotify.exportPlaylist.mutate(exportInput)

  return toPlaylistExportResult(result)
}
