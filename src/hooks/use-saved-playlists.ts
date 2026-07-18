import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import {
  savedPlaylistDetailQueryKey,
  savedPlaylistsQueryKey,
} from '@/lib/user-data-cache'
import {
  deleteSavedPlaylist,
  getSavedPlaylist,
  listSavedPlaylists,
  saveGeneratedPlaylist,
} from '@/services/playlists'
import type {
  GeneratedPlaylist,
  SavePlaylistMode,
  SavedPlaylist,
  SavedPlaylistSummary,
} from '@/models/playlists/models'

type PlaylistDeletionTarget = Pick<SavedPlaylistSummary, 'id' | 'name'>

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
  const [pendingReplacementPlaylist, setPendingReplacementPlaylist] =
    useState<GeneratedPlaylist | null>(null)
  const [pendingDeletionPlaylist, setPendingDeletionPlaylist] =
    useState<PlaylistDeletionTarget | null>(null)

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
    mutationFn: ({
      playlist,
      mode,
    }: {
      playlist: GeneratedPlaylist
      mode: SavePlaylistMode
    }) => saveGeneratedPlaylist(playlist, { mode }),
    onSuccess: (playlist) => {
      setSavedPlaylist(playlist)
      setSelectedPlaylistId(playlist.id)
      setPendingReplacementPlaylist(null)
      queryClient.setQueryData(
        savedPlaylistDetailQueryKey(playlist.id),
        playlist,
      )
      void queryClient.invalidateQueries({ queryKey: savedPlaylistsQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (playlistId: string) => deleteSavedPlaylist(playlistId),
    onSuccess: (playlistId) => {
      queryClient.removeQueries({
        queryKey: savedPlaylistDetailQueryKey(playlistId),
      })
      queryClient.setQueryData<Array<SavedPlaylistSummary>>(
        savedPlaylistsQueryKey,
        (playlists) =>
          playlists?.filter((playlist) => playlist.id !== playlistId) ?? [],
      )
      setSavedPlaylist((currentPlaylist) =>
        currentPlaylist?.id === playlistId ? null : currentPlaylist,
      )
      setSelectedPlaylistId((currentPlaylistId) =>
        currentPlaylistId === playlistId ? null : currentPlaylistId,
      )
      setPendingDeletionPlaylist(null)
      void queryClient.invalidateQueries({ queryKey: savedPlaylistsQueryKey })
    },
  })

  async function save(
    playlist: GeneratedPlaylist,
    {
      mode = 'create',
    }: {
      mode?: SavePlaylistMode
    } = {},
  ) {
    if (mode === 'create' && findSavedPlaylistForArtist(playlist)) {
      setPendingReplacementPlaylist(playlist)
      return null
    }

    const savePromise = saveMutation.mutateAsync({ playlist, mode })

    if (mode === 'create') {
      try {
        const savedPlaylistResult = await savePromise
        toast.success(`${savedPlaylistResult.name} saved`)
        return savedPlaylistResult
      } catch (error) {
        if (isDuplicatePlaylistConflict(error)) {
          saveMutation.reset()
          await listQuery.refetch()
          setPendingReplacementPlaylist(playlist)
          return null
        }

        toast.error(error, 'Playlist could not be saved')
        throw error
      }
    }

    return await toast.promise(savePromise, {
      loading: 'Saving playlist',
      success: (savedPlaylistResult) => `${savedPlaylistResult.name} replaced`,
      error: 'Playlist could not be saved',
    })
  }

  async function replacePendingPlaylist() {
    if (!pendingReplacementPlaylist) {
      return null
    }

    return await save(pendingReplacementPlaylist, { mode: 'replace' })
  }

  function cancelPendingReplacement() {
    setPendingReplacementPlaylist(null)
  }

  function requestDeletion(playlist: PlaylistDeletionTarget) {
    setPendingDeletionPlaylist(playlist)
  }

  function cancelDeletion() {
    if (!deleteMutation.isPending) {
      setPendingDeletionPlaylist(null)
    }
  }

  async function confirmDeletion() {
    if (!pendingDeletionPlaylist) {
      return null
    }

    const { id, name } = pendingDeletionPlaylist

    return await toast.promise(deleteMutation.mutateAsync(id), {
      loading: 'Deleting playlist',
      success: `${name} deleted`,
      error: 'Playlist could not be deleted',
    })
  }

  const selectPlaylist = useCallback((playlistId: string | null) => {
    setSelectedPlaylistId(playlistId)
  }, [])

  function resetSavedPlaylist() {
    setSavedPlaylist(null)
    setSelectedPlaylistId(null)
    setPendingReplacementPlaylist(null)
    setPendingDeletionPlaylist(null)
    saveMutation.reset()
    deleteMutation.reset()
  }

  const selectedPlaylist =
    detailQuery.data?.id === selectedPlaylistId
      ? detailQuery.data
      : savedPlaylist?.id === selectedPlaylistId
        ? savedPlaylist
        : null

  const existingPlaylistForReplacement = pendingReplacementPlaylist
    ? findSavedPlaylistForArtist(pendingReplacementPlaylist)
    : null

  return {
    playlists: listQuery.data ?? ([] satisfies Array<SavedPlaylistSummary>),
    selectedPlaylist,
    selectedPlaylistId,
    pendingReplacementPlaylist,
    existingPlaylistForReplacement,
    needsReplacementConfirmation: Boolean(pendingReplacementPlaylist),
    pendingDeletionPlaylist,
    needsDeletionConfirmation: Boolean(pendingDeletionPlaylist),
    selectPlaylist,
    save,
    replacePendingPlaylist,
    cancelPendingReplacement,
    requestDeletion,
    confirmDeletion,
    cancelDeletion,
    resetSavedPlaylist,
    refetchPlaylists: listQuery.refetch,
    refetchSelectedPlaylist: detailQuery.refetch,
    isLoadingPlaylists: listQuery.isLoading,
    isLoadingSelectedPlaylist: detailQuery.isLoading,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    listError: listQuery.error,
    detailError: detailQuery.error,
    saveError: saveMutation.error,
    errorMessage:
      getErrorMessage(listQuery.error) ??
      getErrorMessage(detailQuery.error) ??
      getErrorMessage(saveMutation.error) ??
      getErrorMessage(deleteMutation.error),
  }

  function findSavedPlaylistForArtist(playlist: GeneratedPlaylist) {
    return (
      (listQuery.data ?? []).find(
        (savedPlaylistSummary) =>
          savedPlaylistSummary.artist.mbid === playlist.artist.mbid,
      ) ?? null
    )
  }
}

function isDuplicatePlaylistConflict(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const data = (error as { data?: { code?: unknown } }).data
  const message = (error as { message?: unknown }).message

  return (
    data?.code === 'CONFLICT' ||
    message === 'A saved playlist already exists for this artist.'
  )
}
