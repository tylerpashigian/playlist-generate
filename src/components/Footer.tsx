import { Text } from '@/components/ui/typography'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border px-4 py-10 text-muted-foreground">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <Text size="sm" className="m-0">
          &copy; {year} Playlist Builder. All rights reserved.
        </Text>
        <Text size="sm" weight="semibold" className="m-0">
          Setlist-informed playlists
        </Text>
      </div>
    </footer>
  )
}
