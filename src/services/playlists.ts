import { toArtistDto } from '@/models/artists/conversions'
import {
  toGeneratedPlaylist,
  toGeneratedPlaylistDto,
  toSavedPlaylist,
  toSavedPlaylistSummary,
} from '@/models/playlists/conversions'
import { trpcClient } from '@/lib/trpc-client'
import type { Artist } from '@/models/artists/models'
import type {
  GeneratedPlaylist,
  SavedPlaylist,
  SavedPlaylistSummary,
} from '@/models/playlists/models'
import type {
  GeneratedPlaylistDto,
  GeneratePlaylistInput,
  PlaylistIdInput,
  SavedPlaylistDto,
  SavedPlaylistSummaryDto,
  SavePlaylistInput,
} from '@/server/contracts/playlists'

export async function generatePlaylist(
  artist: Artist,
): Promise<GeneratedPlaylist> {
  const input: GeneratePlaylistInput = {
    artist: toArtistDto(artist),
  }
  const playlist: GeneratedPlaylistDto =
    await trpcClient.playlists.generate.mutate(input)

  return toGeneratedPlaylist(playlist)
}

export async function saveGeneratedPlaylist(
  playlist: GeneratedPlaylist,
): Promise<SavedPlaylist> {
  const input: SavePlaylistInput = {
    playlist: toGeneratedPlaylistDto(playlist),
  }
  const savedPlaylist: SavedPlaylistDto =
    await trpcClient.playlists.save.mutate(input)

  return toSavedPlaylist(savedPlaylist)
}

export async function listSavedPlaylists(): Promise<
  Array<SavedPlaylistSummary>
> {
  const playlists: Array<SavedPlaylistSummaryDto> =
    await trpcClient.playlists.list.query()

  return playlists.map(toSavedPlaylistSummary)
}

export async function getSavedPlaylist(
  playlistId: string,
): Promise<SavedPlaylist> {
  const input: PlaylistIdInput = { playlistId }
  const playlist: SavedPlaylistDto = await trpcClient.playlists.get.query(input)

  return toSavedPlaylist(playlist)
}
