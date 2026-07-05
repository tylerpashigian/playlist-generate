import { Link, createFileRoute } from '@tanstack/react-router'
import Footer from '@/components/Footer'
import { ExportReadinessMetrics } from '@/components/product/export-actions-panel'
import { PlaylistPreview } from '@/components/product/playlist-preview'
import { WithNavbar } from '@/components/product/product-navbar'
import { Button } from '@/components/ui/button'
import { Heading1, Heading2, Heading4, Text } from '@/components/ui/typography'
import { useAuthSession } from '@/hooks/use-auth-session'

import type { PlaylistPreviewTrack } from '@/components/product/playlist-preview'

export const Route = createFileRoute('/')({ component: LandingRoute })

const previewTracks: Array<PlaylistPreviewTrack> = [
  {
    key: '1-innerbloom',
    position: 1,
    title: 'Innerbloom',
    detail: 'Exact recording',
    evidence: '6/6 setlists',
    confidenceScore: 100,
  },
  {
    key: '2-surrender',
    position: 2,
    title: 'Surrender',
    detail: 'Recent encore rotation',
    evidence: '5/6 setlists',
    confidenceScore: 85,
  },
  {
    key: '3-levitating',
    position: 3,
    title: 'Levitating',
    detail: 'Mid-set rotation',
    evidence: '4/6 setlists',
    confidenceScore: 67,
  },
  {
    key: '4-until-the-sun-needs-to-rise',
    position: 4,
    title: 'Until the Sun Needs to Rise',
    detail: 'Needs review',
    evidence: '3/6 setlists',
    confidenceScore: 49,
  },
]

function LandingRoute() {
  const { isAuthenticated, isSessionLoading } = useAuthSession()

  return (
    <WithNavbar>
      <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 bg-background pb-14 pt-28 md:pb-20 md:pt-36 lg:gap-10">
        <section className="flex max-w-295 flex-col items-center gap-10 px-5 text-center sm:px-8">
          <div className="flex w-full max-w-225 flex-col items-center gap-5">
            <Text
              as="span"
              size="xs"
              weight="semibold"
              className="rounded-full border border-border bg-background px-3 py-2 uppercase text-muted-foreground"
            >
              Setlist-powered playlists
            </Text>
            <LandingDisplayHeading className="max-w-220 text-foreground">
              Know what they&apos;re playing before you go.
            </LandingDisplayHeading>
            <Text size="lg" className="max-w-152 text-muted-foreground">
              Search an artist, generate a ranked playlist from recent shows,
              and export the songs you are most likely to hear.
            </Text>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild>
                <Link to="/app">Start a playlist</Link>
              </Button>
              {!isAuthenticated && !isSessionLoading ? (
                <Button asChild variant="outline">
                  <Link to="/auth">Sign in</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-260 rounded-2xl border border-border bg-card p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.06)] lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x">
            <PlaylistPreview
              title="Rufus Du Sol recent setlist"
              subtitle="4 tracks from 6 recent setlists"
              tracks={previewTracks}
              compact
            />

            <section className="border-t border-border pt-5 text-card-foreground lg:border-t-0 lg:pl-5 lg:pt-0">
              <Text
                size="xs"
                weight="semibold"
                className="uppercase text-muted-foreground"
              >
                Export
              </Text>
              <Heading4 className="mt-1 text-foreground">
                Streaming export
              </Heading4>
              <Text size="sm" className="mt-1 text-muted-foreground">
                Review streaming matches before exporting to connected services.
              </Text>
              <ExportReadinessMetrics
                className="mt-5"
                matchedCount={3}
                reviewCount={1}
              />
            </section>
          </div>
        </section>

        <section className="flex w-full max-w-230 flex-col gap-4 px-5 sm:px-8 md:flex-row">
          {[
            [
              'Search',
              'Find the artist and pull recent public setlist history.',
            ],
            [
              'Score',
              'Weight repeated songs and recency into confidence scores.',
            ],
            [
              'Export',
              'Save drafts and send matched tracks to connected services.',
            ],
          ].map(([title, description], index) => (
            <article
              key={title}
              className="rise-in flex-1 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-[0_24px_80px_rgba(0,0,0,0.06)]"
              style={{ animationDelay: `${index * 90 + 80}ms` }}
            >
              <Heading4 className="text-foreground">{title}</Heading4>
              <Text size="sm" className="mt-2 text-muted-foreground">
                {description}
              </Text>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </WithNavbar>
  )
}

function LandingDisplayHeading({
  children,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <>
      <Heading1 className={'hidden lg:block'}>{children}</Heading1>
      <Heading2 className={'block lg:hidden'}>{children}</Heading2>
    </>
  )
}
