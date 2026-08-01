import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { authorizeAppleMusic } from '@/lib/musickit'
import { getErrorMessage } from '@/lib/errors'
import { spotifyPlaylistExportScopes } from '@/lib/spotify-scopes'
import { toast } from '@/lib/toast'
import { streamingConnectionsQueryKey } from '@/lib/user-data-cache'
import {
  disconnectStreamingProvider,
  listStreamingConnections,
} from '@/services/streaming'
import {
  connectAppleMusic as saveAppleMusicConnection,
  disconnectAppleMusicEverywhere as removeAppleMusicConnections,
  getAppleMusicDeveloperToken,
} from '@/services/apple-music'
import type {
  StreamingConnection,
  StreamingProvider,
} from '@/models/streaming/models'

type ConnectionErrors = Record<StreamingProvider, string | null>

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
  const [connectionErrors, setConnectionErrors] = useState<ConnectionErrors>({
    SPOTIFY: null,
    APPLE_MUSIC: null,
  })
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false)
  const [isConnectingAppleMusic, setIsConnectingAppleMusic] = useState(false)

  function setConnectionError(
    provider: StreamingProvider,
    error: string | null,
  ) {
    setConnectionErrors((current) => ({ ...current, [provider]: error }))
  }

  function updateConnectionCache(connection: StreamingConnection) {
    queryClient.setQueryData<Array<StreamingConnection>>(
      streamingConnectionsQueryKey,
      (connections = []) => [
        ...connections.filter((item) => item.provider !== connection.provider),
        connection,
      ],
    )
  }

  const connectionsQuery = useQuery({
    queryKey: streamingConnectionsQueryKey,
    queryFn: () => listStreamingConnections(),
    enabled,
  })

  const disconnectSpotifyMutation = useMutation({
    mutationFn: () => disconnectStreamingProvider('SPOTIFY'),
    onMutate: () => setConnectionError('SPOTIFY', null),
    onSuccess: (connection) => {
      updateConnectionCache(connection)
      void queryClient.invalidateQueries({
        queryKey: streamingConnectionsQueryKey,
      })
    },
    onError: (error) => {
      setConnectionError(
        'SPOTIFY',
        getErrorMessage(error) ?? 'Spotify disconnect failed',
      )
    },
  })
  const disconnectAppleMusicMutation = useMutation({
    mutationFn: () => disconnectStreamingProvider('APPLE_MUSIC'),
    onMutate: () => setConnectionError('APPLE_MUSIC', null),
    onSuccess: (connection) => {
      updateConnectionCache(connection)
      void queryClient.invalidateQueries({
        queryKey: streamingConnectionsQueryKey,
      })
    },
    onError: (error) => {
      setConnectionError(
        'APPLE_MUSIC',
        getErrorMessage(error) ?? 'Apple Music disconnect failed',
      )
    },
  })
  const disconnectAllAppleMusicMutation = useMutation({
    mutationFn: () => removeAppleMusicConnections(),
    onMutate: () => setConnectionError('APPLE_MUSIC', null),
    onSuccess: (connection) => {
      updateConnectionCache(connection)
      void queryClient.invalidateQueries({
        queryKey: streamingConnectionsQueryKey,
      })
    },
    onError: (error) => {
      setConnectionError(
        'APPLE_MUSIC',
        getErrorMessage(error) ?? 'Apple Music disconnect failed',
      )
    },
  })

  async function disconnect(provider: StreamingProvider) {
    const providerName = provider === 'APPLE_MUSIC' ? 'Apple Music' : 'Spotify'
    const mutation =
      provider === 'APPLE_MUSIC'
        ? disconnectAppleMusicMutation
        : disconnectSpotifyMutation

    return await toast.promise(mutation.mutateAsync(), {
      loading: `Disconnecting ${providerName}`,
      success: `${providerName} disconnected`,
      error: `${providerName} disconnect failed`,
    })
  }

  async function disconnectAllAppleMusic() {
    return await toast.promise(disconnectAllAppleMusicMutation.mutateAsync(), {
      loading: 'Disconnecting Apple Music everywhere',
      success: 'Apple Music disconnected on all devices',
      error: 'Apple Music disconnect failed',
    })
  }

  async function connectAppleMusic() {
    setConnectionError('APPLE_MUSIC', null)
    setIsConnectingAppleMusic(true)
    try {
      toast.info('Opening Apple Music authorization')
      const { developerToken } = await getAppleMusicDeveloperToken()
      const musicUserToken = await authorizeAppleMusic(developerToken)
      const connection = await saveAppleMusicConnection(musicUserToken)
      updateConnectionCache(connection)
      toast.success('Apple Music connected')
      return Boolean(connection.connected)
    } catch (error) {
      const message = getErrorMessage(error) ?? 'Apple Music connection failed'
      setConnectionError('APPLE_MUSIC', message)
      toast.error(error, message)
      return false
    } finally {
      setIsConnectingAppleMusic(false)
    }
  }

  async function connectSpotify() {
    if (!isSpotifyAvailable) {
      const message = 'Spotify is currently available only to beta users.'
      setConnectionError('SPOTIFY', message)
      toast.error(new Error(message), message)
      return false
    }

    setConnectionError('SPOTIFY', null)
    setIsConnectingSpotify(true)

    try {
      toast.info('Opening Spotify connection')

      const result = await authClient.linkSocial({
        provider: 'spotify',
        scopes: [...spotifyPlaylistExportScopes],
        callbackURL: spotifyCallbackURL,
      })

      if (result.error) {
        const message = result.error.message ?? 'Spotify connection failed'
        setConnectionError('SPOTIFY', message)
        toast.error(result.error, message)
        return false
      }

      if (!result.data.redirect) {
        await connectionsQuery.refetch()
        toast.success('Spotify connected')
      }

      return true
    } catch (error) {
      const message = getErrorMessage(error) ?? 'Spotify connection failed'
      setConnectionError('SPOTIFY', message)
      toast.error(error, message)
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
  const appleMusicConnection =
    connections.find((connection) => connection.provider === 'APPLE_MUSIC') ??
    null
  const isSpotifyAvailable = Boolean(spotifyConnection?.available)

  return {
    connections,
    spotifyConnection,
    appleMusicConnection,
    isSpotifyAvailable,
    isSpotifyConnected:
      isSpotifyAvailable && Boolean(spotifyConnection?.connected),
    isAppleMusicConnected: Boolean(appleMusicConnection?.connected),
    connectSpotify,
    connectAppleMusic,
    disconnect,
    disconnectAllAppleMusic,
    refreshConnections: connectionsQuery.refetch,
    isLoading: connectionsQuery.isLoading,
    isRefreshing: connectionsQuery.isRefetching,
    isConnectingSpotify,
    isConnectingAppleMusic,
    isDisconnectingSpotify: disconnectSpotifyMutation.isPending,
    isDisconnectingAppleMusic: disconnectAppleMusicMutation.isPending,
    isDisconnectingAllAppleMusic: disconnectAllAppleMusicMutation.isPending,
    connectionsError: connectionsQuery.error,
    spotifyErrorMessage:
      connectionErrors.SPOTIFY ??
      getErrorMessage(connectionsQuery.error) ??
      null,
    appleMusicErrorMessage:
      connectionErrors.APPLE_MUSIC ??
      getErrorMessage(connectionsQuery.error) ??
      null,
  }
}
