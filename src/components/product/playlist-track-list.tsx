import type {
  GeneratedPlaylist,
  SavedPlaylist,
} from '@/models/playlists/models'
import { Text } from '@/components/ui/typography'

export function PlaylistTrackList({
  playlist,
}: {
  playlist: GeneratedPlaylist | SavedPlaylist
}) {
  return (
    <ol className="mt-4 grid gap-2">
      {playlist.tracks.map((track) => (
        <li
          key={`${track.position}-${track.normalizedTitle}`}
          className="grid gap-1 border border-border bg-background p-3 sm:grid-cols-[1fr_auto]"
        >
          <div>
            <Text size="sm" weight="semibold" className="text-foreground">
              {track.position}. {track.title}
            </Text>
            <Text size="xs" className="text-muted-foreground">
              Played {track.appearanceCount} of {track.totalSetlistsConsidered}{' '}
              setlists
              {track.isCover && track.originalArtistName
                ? ` - cover: ${track.originalArtistName}`
                : ''}
            </Text>
          </div>
          <Text size="sm" weight="semibold" className="text-primary">
            {Math.round(track.confidenceScore)}%
          </Text>
        </li>
      ))}
    </ol>
  )
}
