import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { getErrorMessage } from '@/lib/errors'
import {
  disconnectStreamingProvider,
  listStreamingConnections,
} from '@/services/streaming'
import type {
  StreamingConnection,
  StreamingProvider,
} from '@/models/streaming/models'

const streamingConnectionsQueryKey = ['streaming-connections'] as const

function getSpotifyProvider() {
  return 'SPOTIFY'
}

export function useStreamingConnections({
  enabled = true,
  spotifyCallbackURL = '/profile',
}: {
  enabled?: boolean
  spotifyCallbackURL?: string
} = {}) {
  const queryClient = useQueryClient()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false)

  const connectionsQuery = useQuery({
    queryKey: streamingConnectionsQueryKey,
    queryFn: () => listStreamingConnections(),
    enabled,
  })

  const disconnectMutation = useMutation({
    mutationFn: (provider: StreamingProvider) =>
      disconnectStreamingProvider(provider),
    onSuccess: (connection) => {
      const disconnectedProvider: string = connection.provider
      queryClient.setQueryData<Array<StreamingConnection>>(
        streamingConnectionsQueryKey,
        (connections = []) => {
          const withoutProvider = connections.filter(
            (item) => item.provider !== disconnectedProvider,
          )
          return [...withoutProvider, connection]
        },
      )
      void queryClient.invalidateQueries({
        queryKey: streamingConnectionsQueryKey,
      })
    },
  })

  async function disconnect(provider: StreamingProvider) {
    return await disconnectMutation.mutateAsync(provider)
  }

  async function connectSpotify() {
    setConnectError(null)
    setIsConnectingSpotify(true)

    try {
      const result = await authClient.linkSocial({
        provider: 'spotify',
        scopes: ['playlist-modify-private'],
        callbackURL: spotifyCallbackURL,
      })

      if (result.error) {
        setConnectError(result.error.message ?? 'Spotify connection failed')
        return false
      }

      if (!result.data.redirect) {
        await connectionsQuery.refetch()
      }

      return true
    } catch (error) {
      setConnectError(getErrorMessage(error) ?? 'Spotify connection failed')
      return false
    } finally {
      setIsConnectingSpotify(false)
    }
  }

  const connections = connectionsQuery.data ?? []
  const spotifyProvider = getSpotifyProvider()
  const spotifyConnection =
    connections.find((connection) => connection.provider === spotifyProvider) ??
    null

  return {
    connections,
    spotifyConnection,
    isSpotifyConnected: Boolean(spotifyConnection?.connected),
    connectSpotify,
    disconnect,
    refreshConnections: connectionsQuery.refetch,
    isLoading: connectionsQuery.isLoading,
    isRefreshing: connectionsQuery.isRefetching,
    isConnectingSpotify,
    isDisconnecting: disconnectMutation.isPending,
    connectionsError: connectionsQuery.error,
    disconnectError: disconnectMutation.error,
    connectError,
    errorMessage:
      connectError ??
      getErrorMessage(connectionsQuery.error) ??
      getErrorMessage(disconnectMutation.error),
  }
}
