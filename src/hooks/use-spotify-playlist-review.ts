import { useCallback, useEffect } from 'react'
import { useSpotify } from '@/hooks/use-spotify'
import { useStreamingTrackReview } from '@/hooks/use-streaming-track-review'
import type { StreamingTrackReviewProvider } from '@/hooks/use-streaming-track-review'
import type { SavedPlaylist } from '@/models/playlists/models'

export function useSpotifyPlaylistReview(playlist: SavedPlaylist | null) {
  const spotify = useSpotify()
  const playlistId = playlist?.id ?? null
  const { loadMatches, reset: resetSpotify } = spotify
  const review = useStreamingTrackReview({
    playlist,
    providers: [createSpotifyReviewProvider({ spotify, playlistId })],
  })

  const reloadMatches = useCallback(async () => {
    resetSpotify()

    if (playlistId) {
      await loadMatches(playlistId)
    }
  }, [loadMatches, playlistId, resetSpotify])

  useEffect(() => {
    void reloadMatches().catch(() => undefined)
  }, [reloadMatches])

  return { spotify, review, reloadMatches, resetSpotify }
}

function createSpotifyReviewProvider({
  spotify,
  playlistId,
}: {
  spotify: ReturnType<typeof useSpotify>
  playlistId: string | null
}): StreamingTrackReviewProvider {
  return {
    provider: 'SPOTIFY',
    label: 'Spotify',
    matches: spotify.matches,
    candidates: spotify.candidates,
    isSearching: spotify.isSearchingTracks,
    isSaving: spotify.isSelectingTrack || spotify.isSkippingTrack,
    search: async (track, query) => {
      if (!playlistId || !track.id) return

      await spotify.searchTracks({
        playlistId,
        playlistItemId: track.id,
        query,
      })
    },
    select: async (track, candidate) => {
      if (!playlistId || !track.id) return

      await spotify.selectTrack({
        playlistId,
        playlistItemId: track.id,
        spotifyTrackId: candidate.providerTrackId,
      })
    },
    skip: async (track) => {
      if (!playlistId || !track.id) return

      await spotify.skipTrack({
        playlistId,
        playlistItemId: track.id,
      })
    },
    clearCandidates: spotify.clearCandidates,
  }
}
