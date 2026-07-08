import { Link, createFileRoute } from '@tanstack/react-router'
import Footer from '@/components/Footer'
import { ExportReadinessMetrics } from '@/components/product/export-actions-panel'
import { PlaylistPreview } from '@/components/product/playlist-preview'
import { WithNavbar } from '@/components/product/product-navbar'
import { Button } from '@/components/ui/button'
import { Heading1, Heading2, Heading4, Text } from '@/components/ui/typography'
import { useAuthSession } from '@/hooks/use-auth-session'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'

import type { PlaylistPreviewTrack } from '@/components/product/playlist-preview'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({ component: LandingRoute })

const previewTracks: Array<PlaylistPreviewTrack> = [
  {
    key: '1-innerbloom',
    position: 1,
    title: 'Innerbloom',
    detail: 'Exact recording',
    evidence: '10/10 setlists',
    confidenceScore: 100,
  },
  {
    key: '2-surrender',
    position: 2,
    title: 'Surrender',
    detail: 'Recent encore rotation',
    evidence: '8/10 setlists',
    confidenceScore: 85,
  },
  {
    key: '3-levitating',
    position: 3,
    title: 'Levitating',
    detail: 'Mid-set rotation',
    evidence: '6/10 setlists',
    confidenceScore: 67,
  },
  {
    key: '4-until-the-sun-needs-to-rise',
    position: 4,
    title: 'Until the Sun Needs to Rise',
    detail: 'Needs review',
    evidence: '4/10 setlists',
    confidenceScore: 49,
  },
]

const previewAnnotations = [
  '10 recent setlists',
  'Confidence ranked',
  'Review covers',
  'Export ready',
] as const

const workflowSteps = [
  {
    title: 'Search',
    description: 'Find the artist and pull recent public setlist history.',
  },
  {
    title: 'Score',
    description: 'Weight repeated songs and recency into confidence scores.',
  },
  {
    title: 'Prepare',
    description:
      'Review likely songs before saving or exporting a clean playlist.',
  },
] as const

const accuracyPoints = [
  {
    title: 'Recent setlists first',
    description:
      'Encore favors what an artist is playing now instead of popularity charts or all-time streams.',
  },
  {
    title: 'Transparent confidence',
    description:
      'Every track shows how often it appeared across recent shows so low-confidence picks are easy to spot.',
  },
] as const

function LandingRoute() {
  const { isAuthenticated, isSessionLoading } = useAuthSession()
  const shouldReduceMotion = useReducedMotion()

  return (
    <WithNavbar>
      <main className="flex min-h-dvh w-full flex-col items-center gap-14 bg-background pb-14 pt-28 md:gap-20 md:pb-20 md:pt-36">
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

          <div className="mx-auto flex w-full max-w-260 flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-2 text-left">
              {previewAnnotations.map((annotation) => (
                <Badge key={annotation} variant="outline" size="lg">
                  {annotation}
                </Badge>
              ))}
            </div>

            <div className="grid w-full rounded-2xl border border-border bg-card p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.06)] lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x">
              <PlaylistPreview
                title="Rufus Du Sol recent setlist"
                subtitle="4 tracks from 10 recent setlists"
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
                  Review streaming matches before exporting to connected
                  services.
                </Text>
                <ExportReadinessMetrics
                  className="mt-5"
                  matchedCount={3}
                  reviewCount={1}
                />
              </section>
            </div>
          </div>
        </section>

        <LazyMotion features={domAnimation}>
          <section className="flex w-full max-w-230 flex-col gap-5 px-5 text-center sm:px-8">
            <div className="mx-auto max-w-150">
              <Heading2 className="text-foreground">How Encore works</Heading2>
              <Text size="md" className="mt-3 text-muted-foreground">
                Build a playlist from the songs artists are actually playing,
                then decide what is worth saving or exporting.
              </Text>
            </div>

            <div className="flex flex-col gap-4 text-left md:flex-row">
              {workflowSteps.map(({ title, description }, index) => (
                <m.article
                  key={title}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    delay: shouldReduceMotion ? 0 : index * 0.09 + 0.08,
                    duration: shouldReduceMotion ? 0 : 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="flex-1 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-[0_24px_80px_rgba(0,0,0,0.06)]"
                >
                  <Text
                    as="span"
                    size="xs"
                    weight="semibold"
                    className="text-review"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Heading4 className="text-foreground">{title}</Heading4>
                  <Text size="sm" className="mt-2 text-muted-foreground">
                    {description}
                  </Text>
                </m.article>
              ))}
            </div>
          </section>
        </LazyMotion>

        <section className="grid w-full max-w-260 gap-6 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <Text
              as="span"
              size="xs"
              weight="semibold"
              className="uppercase text-muted-foreground"
            >
              Accuracy
            </Text>
            <Heading2 className="mt-2 max-w-150 text-foreground">
              Built from recent setlists, not popularity charts.
            </Heading2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {accuracyPoints.map((point) => (
              <article
                key={point.title}
                className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
              >
                <Heading4 className="text-foreground">{point.title}</Heading4>
                <Text size="sm" className="mt-2 text-muted-foreground">
                  {point.description}
                </Text>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full px-5 sm:px-8">
          <div className="mx-auto flex max-w-230 flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
            <Heading2 className="text-foreground">
              Build your first setlist playlist.
            </Heading2>
            <Text size="md" className="max-w-130 text-muted-foreground">
              Start with an artist search, preview likely tracks, and decide
              whether to save or export after the playlist feels right.
            </Text>
            <Button asChild>
              <Link to="/app">Start a playlist</Link>
            </Button>
          </div>
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
