import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import {
  getSavedPlaylist,
  listSavedPlaylists,
  saveGeneratedPlaylist,
} from '@/services/playlists'
import type {
  GeneratedPlaylist,
  SavedPlaylist,
  SavedPlaylistSummary,
} from '@/models/playlists/models'

const savedPlaylistsQueryKey = ['saved-playlists'] as const

function savedPlaylistDetailQueryKey(playlistId: string | null) {
  return ['saved-playlist', playlistId] as const
}

export function useSavedPlaylists({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const queryClient = useQueryClient()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  )
  const [savedPlaylist, setSavedPlaylist] = useState<SavedPlaylist | null>(null)

  const listQuery = useQuery({
    queryKey: savedPlaylistsQueryKey,
    queryFn: () => listSavedPlaylists(),
    enabled,
  })

  const detailQuery = useQuery({
    queryKey: savedPlaylistDetailQueryKey(selectedPlaylistId),
    queryFn: () => getSavedPlaylist(selectedPlaylistId ?? ''),
    enabled: enabled && Boolean(selectedPlaylistId),
  })

  const saveMutation = useMutation({
    mutationFn: (playlist: GeneratedPlaylist) =>
      saveGeneratedPlaylist(playlist),
    onSuccess: (playlist) => {
      setSavedPlaylist(playlist)
      setSelectedPlaylistId(playlist.id)
      queryClient.setQueryData(
        savedPlaylistDetailQueryKey(playlist.id),
        playlist,
      )
      void queryClient.invalidateQueries({ queryKey: savedPlaylistsQueryKey })
    },
  })

  async function save(playlist: GeneratedPlaylist) {
    return await toast.promise(saveMutation.mutateAsync(playlist), {
      loading: 'Saving playlist',
      success: (savedPlaylistResult) => `${savedPlaylistResult.name} saved`,
      error: 'Playlist could not be saved',
    })
  }

  const selectPlaylist = useCallback((playlistId: string | null) => {
    setSelectedPlaylistId(playlistId)
  }, [])

  function resetSavedPlaylist() {
    setSavedPlaylist(null)
    setSelectedPlaylistId(null)
    saveMutation.reset()
  }

  const selectedPlaylist =
    detailQuery.data?.id === selectedPlaylistId
      ? detailQuery.data
      : savedPlaylist?.id === selectedPlaylistId
        ? savedPlaylist
        : null

  return {
    playlists: listQuery.data ?? ([] satisfies Array<SavedPlaylistSummary>),
    selectedPlaylist,
    selectedPlaylistId,
    selectPlaylist,
    save,
    resetSavedPlaylist,
    refetchPlaylists: listQuery.refetch,
    refetchSelectedPlaylist: detailQuery.refetch,
    isLoadingPlaylists: listQuery.isLoading,
    isLoadingSelectedPlaylist: detailQuery.isLoading,
    isSaving: saveMutation.isPending,
    listError: listQuery.error,
    detailError: detailQuery.error,
    saveError: saveMutation.error,
    errorMessage:
      getErrorMessage(listQuery.error) ??
      getErrorMessage(detailQuery.error) ??
      getErrorMessage(saveMutation.error),
  }
}
