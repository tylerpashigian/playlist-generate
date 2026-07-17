import type { QueryClient } from '@tanstack/react-query'

export const savedPlaylistsQueryKey = ['saved-playlists'] as const
export const savedPlaylistQueryKey = ['saved-playlist'] as const
export const streamingConnectionsQueryKey = ['streaming-connections'] as const

export function savedPlaylistDetailQueryKey(playlistId: string | null) {
  return [...savedPlaylistQueryKey, playlistId] as const
}

export function clearUserDataCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: savedPlaylistsQueryKey })
  queryClient.removeQueries({ queryKey: savedPlaylistQueryKey })
  queryClient.removeQueries({ queryKey: streamingConnectionsQueryKey })
}
