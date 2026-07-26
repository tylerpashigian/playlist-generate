import { toAppleMusicTrackCandidate } from '@/models/apple-music/conversions'
import { trpcClient } from '@/lib/trpc-client'
import {
  toPlaylistExportResult,
  toStreamingConnection,
  toTrackMatch,
} from '@/models/streaming/conversions'
import type {
  PlaylistExportResult,
  StreamingConnection,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'
import type { StreamingConnectionDto } from '@/server/contracts/streaming'

export async function getAppleMusicDeveloperToken() {
  return await trpcClient.appleMusic.developerToken.query()
}

export async function connectAppleMusic(
  musicUserToken: string,
): Promise<StreamingConnection> {
  return await trpcClient.appleMusic.connect.mutate({ musicUserToken })
}

export async function disconnectAppleMusicEverywhere() {
  const connection: StreamingConnectionDto =
    await trpcClient.appleMusic.disconnectAll.mutate()
  return toStreamingConnection(connection)
}

export async function matchAppleMusicPlaylistTracks(
  playlistId: string,
): Promise<Array<TrackMatch>> {
  const matches = await trpcClient.appleMusic.matchTracks.mutate({ playlistId })
  return matches.map(toTrackMatch)
}

export async function getAppleMusicTrackMatches(
  playlistId: string,
): Promise<Array<TrackMatch>> {
  const matches = await trpcClient.appleMusic.matches.query({ playlistId })
  return matches.map(toTrackMatch)
}

export async function searchAppleMusicTrackCandidates(input: {
  playlistId: string
  playlistItemId: string
  query: string
}): Promise<Array<StreamingTrackCandidate>> {
  const candidates = await trpcClient.appleMusic.searchTracks.mutate(input)
  return candidates.map(toAppleMusicTrackCandidate)
}

export async function selectAppleMusicTrack(input: {
  playlistId: string
  playlistItemId: string
  appleMusicTrackId: string
}): Promise<TrackMatch> {
  return toTrackMatch(await trpcClient.appleMusic.selectTrack.mutate(input))
}

export async function skipAppleMusicTrack(input: {
  playlistId: string
  playlistItemId: string
}): Promise<TrackMatch> {
  return toTrackMatch(await trpcClient.appleMusic.skipTrack.mutate(input))
}

export async function exportPlaylistToAppleMusic(input: {
  playlistId: string
  name?: string
}): Promise<PlaylistExportResult> {
  return toPlaylistExportResult(
    await trpcClient.appleMusic.exportPlaylist.mutate(input),
  )
}
