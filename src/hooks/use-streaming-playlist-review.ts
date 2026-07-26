import { useCallback, useEffect } from 'react'
import { useSpotify } from '@/hooks/use-spotify'
import { useAppleMusic } from '@/hooks/use-apple-music'
import { useStreamingConnections } from '@/hooks/use-streaming-connections'
import { useStreamingTrackReview } from '@/hooks/use-streaming-track-review'
import type { StreamingTrackReviewProvider } from '@/hooks/use-streaming-track-review'
import type { SavedPlaylist } from '@/models/playlists/models'

export function useStreamingPlaylistReview(playlist: SavedPlaylist | null) {
  const spotify = useSpotify()
  const appleMusic = useAppleMusic()
  const playlistId = playlist?.id ?? null
  const streamingConnections = useStreamingConnections({
    enabled: Boolean(playlistId),
  })
  const { loadMatches, reset: resetSpotify } = spotify
  const { loadMatches: loadAppleMusicMatches, reset: resetAppleMusic } =
    appleMusic
  const review = useStreamingTrackReview({
    playlist,
    providers: [
      createSpotifyReviewProvider({ spotify, playlistId }),
      createAppleMusicReviewProvider({ appleMusic, playlistId }),
    ],
  })

  const reloadMatches = useCallback(async () => {
    resetSpotify()
    resetAppleMusic()

    if (playlistId && !streamingConnections.isLoading) {
      const loads = []

      if (streamingConnections.isSpotifyConnected) {
        loads.push(loadMatches(playlistId))
      }

      if (streamingConnections.isAppleMusicConnected) {
        loads.push(loadAppleMusicMatches(playlistId))
      }

      await Promise.all(loads)
    }
  }, [
    loadAppleMusicMatches,
    loadMatches,
    playlistId,
    resetAppleMusic,
    resetSpotify,
    streamingConnections.isAppleMusicConnected,
    streamingConnections.isLoading,
    streamingConnections.isSpotifyConnected,
  ])

  useEffect(() => {
    void reloadMatches().catch(() => undefined)
  }, [reloadMatches])

  const resetStreaming = useCallback(() => {
    resetSpotify()
    resetAppleMusic()
  }, [resetAppleMusic, resetSpotify])

  return { spotify, appleMusic, review, reloadMatches, resetStreaming }
}

function createAppleMusicReviewProvider({
  appleMusic,
  playlistId,
}: {
  appleMusic: ReturnType<typeof useAppleMusic>
  playlistId: string | null
}): StreamingTrackReviewProvider {
  return {
    provider: 'APPLE_MUSIC',
    label: 'Apple Music',
    matches: appleMusic.matches,
    candidates: appleMusic.candidates,
    isSearching: appleMusic.isSearchingTracks,
    isSaving: appleMusic.isSelectingTrack || appleMusic.isSkippingTrack,
    search: async (track, query) => {
      if (!playlistId || !track.id) return
      await appleMusic.searchTracks({
        playlistId,
        playlistItemId: track.id,
        query,
      })
    },
    select: async (track, candidate) => {
      if (!playlistId || !track.id) return
      await appleMusic.selectTrack({
        playlistId,
        playlistItemId: track.id,
        appleMusicTrackId: candidate.providerTrackId,
      })
    },
    skip: async (track) => {
      if (!playlistId || !track.id) return
      await appleMusic.skipTrack({ playlistId, playlistItemId: track.id })
    },
    clearCandidates: appleMusic.clearCandidates,
  }
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
