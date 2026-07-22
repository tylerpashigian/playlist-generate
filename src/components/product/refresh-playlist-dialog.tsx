import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function RefreshPlaylistDialog({
  open,
  playlistName,
  isRefreshing,
  onConfirm,
  onCancel,
}: {
  open: boolean
  playlistName: string | null
  isRefreshing: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isRefreshing) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refresh from recent setlists?</AlertDialogTitle>
          <AlertDialogDescription>
            {playlistName ? `${playlistName} will be updated. ` : ''}
            Confidence scores and evidence will be recalculated, and songs may
            be added or removed. Exclusions and streaming matches are preserved
            for songs that remain. Existing Spotify playlists will not be
            changed automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRefreshing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isRefreshing}
            onClick={() => {
              void onConfirm().catch(() => undefined)
            }}
          >
            {isRefreshing ? 'Refreshing' : 'Refresh playlist'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
