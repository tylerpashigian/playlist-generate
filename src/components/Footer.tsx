import { Text } from '@/components/ui/typography'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border px-5 py-10 text-muted-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-295 flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <Text size="sm" className="m-0">
          &copy; {year} Encore. All rights reserved.
        </Text>
        <Text size="sm" weight="semibold" className="m-0">
          Setlist-informed playlists
        </Text>
      </div>
    </footer>
  )
}
