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

export function DeletePlaylistDialog({
  playlistName,
  open,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  playlistName: string | null
  open: boolean
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isDeleting) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete saved playlist?</AlertDialogTitle>
          <AlertDialogDescription>
            {playlistName
              ? `${playlistName} and its confidence evidence, saved track matches, and local export metadata will be permanently removed from Encore.`
              : 'This playlist and its confidence evidence, saved track matches, and local export metadata will be permanently removed from Encore.'}
          </AlertDialogDescription>
          <AlertDialogDescription>
            Any exported Spotify playlist will remain available in Spotify.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              void onConfirm().catch(() => undefined)
            }}
          >
            {isDeleting ? 'Deleting' : 'Delete playlist'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
