import {
  toPlaylistExportResult,
  toTrackMatch,
} from '@/models/spotify/conversions'
import { trpcClient } from '@/lib/trpc-client'
import type { PlaylistExportResult, TrackMatch } from '@/models/spotify/models'
import type {
  ExportPlaylistDto,
  ExportPlaylistInput,
  MatchTracksInput,
  TrackMatchDto,
} from '@/server/contracts/spotify'

export async function matchPlaylistTracks(
  playlistId: string,
): Promise<Array<TrackMatch>> {
  const input: MatchTracksInput = { playlistId }
  const matches: Array<TrackMatchDto> =
    await trpcClient.spotify.matchTracks.mutate(input)

  return matches.map(toTrackMatch)
}

export async function exportPlaylistToSpotify(
  input: {
    playlistId: string
    name?: string
  },
): Promise<PlaylistExportResult> {
  const exportInput: ExportPlaylistInput = input
  const result: ExportPlaylistDto =
    await trpcClient.spotify.exportPlaylist.mutate(exportInput)

  return toPlaylistExportResult(result)
}
