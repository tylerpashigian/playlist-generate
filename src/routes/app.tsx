import { createFileRoute } from '@tanstack/react-router'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import { PlaylistWorkflow } from '@/components/product/playlist-workflow'
import { Heading2, Text } from '@/components/ui/typography'

export const Route = createFileRoute('/app')({
  component: AppRoute,
})

function AppRoute() {
  return (
    <WithNavbar>
      <main className="min-h-dvh bg-primary-foreground">
        <NavbarOffset>
          <div className="mx-auto max-w-280 px-5 pb-16 pt-14 sm:px-8">
            <section className="flex flex-col items-start justify-start gap-8 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  Playlist builder
                </Text>
                <Heading2 className="mt-4 max-w-150 text-foreground">
                  Build from the set they are actually playing.
                </Heading2>
              </div>
              <Text size="sm" className="max-w-80 text-muted-foreground">
                Search an artist, review confidence from recent setlists, then
                export a clean playlist to any connected service.
              </Text>
            </section>

            <PlaylistWorkflow />
          </div>
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}
