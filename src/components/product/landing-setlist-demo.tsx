import { useState } from 'react'
import {
  ArrowRight01Icon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'motion/react'

import { ExportReadinessMetrics } from '@/components/product/export-actions-panel'
import { PlaylistPreview } from '@/components/product/playlist-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heading4, Text } from '@/components/ui/typography'
import { getRecencyWeights } from '@/lib/recency-weighting'

import type { PlaylistPreviewTrack } from '@/components/product/playlist-preview'

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
    confidenceScore: 78,
  },
  {
    key: '4-until-the-sun-needs-to-rise',
    position: 4,
    title: 'Until the Sun Needs to Rise',
    detail: 'Needs review',
    evidence: '4/10 setlists',
    confidenceScore: 67,
  },
]

const sampleSetlistCount = 10
const recencyWeights = getRecencyWeights(sampleSetlistCount)
const strongestRecencyWeight = recencyWeights[0] ?? 1

export function LandingSetlistDemo() {
  const [isRevealed, setIsRevealed] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.32,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  }

  return (
    <LazyMotion features={domAnimation}>
      <section
        aria-label="Interactive setlist confidence preview"
        className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left"
      >
        <div className="flex flex-col gap-4 border-b border-border/70 bg-muted/35 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <Text
              as="span"
              size="xs"
              weight="semibold"
              className="uppercase text-muted-foreground"
            >
              Try the field guide
            </Text>
            <Heading4 className="mt-1 text-foreground">
              Search recent shows. Reveal the likely set.
            </Heading4>
          </div>
          <Badge variant="outline" size="lg" className="w-fit bg-background">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                isRevealed ? 'bg-success' : 'bg-muted-foreground'
              }`}
            />
            <span aria-live="polite">
              {isRevealed
                ? 'Confidence ranked'
                : `Sample · ${sampleSetlistCount} setlists`}
            </span>
          </Badge>
        </div>

        <div className="grid gap-3 border-b border-border/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
          <div className="grid gap-2">
            <Text as="span" size="xs" weight="semibold">
              Sample artist
            </Text>
            <div
              aria-label="Sample artist: RÜFÜS DU SOL"
              className="flex min-h-11 items-center gap-3 rounded-md border border-input bg-background px-3 text-foreground shadow-xs"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={Search01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <Text as="span" size="sm" weight="medium">
                RÜFÜS DU SOL
              </Text>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-11 self-end px-4"
            onClick={() => setIsRevealed((current) => !current)}
          >
            {isRevealed ? (
              <>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={RefreshIcon}
                  strokeWidth={2}
                />
                Reset preview
              </>
            ) : (
              <>
                Reveal likely set
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                />
              </>
            )}
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="border-b border-border pb-5">
            <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-end">
              <div>
                <Text size="sm" weight="semibold" className="text-foreground">
                  How Encore weighs recent shows
                </Text>
                <Text size="xs" className="mt-1 text-muted-foreground">
                  Newer setlists contribute more points to every song they
                  contain.
                </Text>
              </div>
              <div>
                <div
                  aria-label={`Sample scoring weights for ${sampleSetlistCount} recent setlists: ${recencyWeights.join(', ')} points from newest to oldest. These bars are recency weights, not song counts for individual concerts.`}
                  className="flex h-16 items-end gap-2"
                  role="img"
                >
                  {recencyWeights.map((weight, index) => (
                    <m.span
                      key={weight}
                      aria-hidden="true"
                      className="h-full min-w-2 flex-1 origin-bottom rounded-t-sm"
                      initial={false}
                      animate={{
                        backgroundColor: isRevealed
                          ? 'var(--foreground)'
                          : 'var(--border)',
                        scaleY: isRevealed
                          ? weight / strongestRecencyWeight
                          : 0.18,
                      }}
                      transition={{
                        ...transition,
                        delay: shouldReduceMotion ? 0 : 0.04 + index * 0.035,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between">
                  <Text size="xs" className="text-muted-foreground">
                    Newest · {strongestRecencyWeight} points
                  </Text>
                  <Text size="xs" className="text-muted-foreground">
                    Oldest · 1 point
                  </Text>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-muted-foreground">
              <Text as="span" size="xs" weight="semibold">
                Recent-show weights
              </Text>
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              <Text as="span" size="xs" weight="semibold">
                Ranked confidence
              </Text>
            </div>
          </div>

          <AnimatePresence initial={false} mode="wait">
            {isRevealed ? (
              <m.div
                key="ranked"
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        clipPath: 'inset(0 0 12% 0 round 12px)',
                        opacity: 0,
                        y: 10,
                      }
                }
                animate={{
                  clipPath: 'inset(0 0 0% 0 round 12px)',
                  opacity: 1,
                  y: 0,
                }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0, transition: { duration: 0.16 } }
                }
                transition={{
                  ...transition,
                  delay: shouldReduceMotion ? 0 : 0.12,
                }}
                className="grid pt-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:divide-x"
              >
                <PlaylistPreview
                  title="RÜFÜS DU SOL recent setlist"
                  subtitle={`Sample preview · 4 tracks ranked from ${sampleSetlistCount} recent setlists`}
                  tracks={previewTracks}
                  className="px-0 lg:pr-6"
                  compact
                />

                <section className="mt-5 border-t border-border pt-5 text-card-foreground lg:mt-0 lg:border-t-0 lg:pl-5 lg:pt-0">
                  <Text
                    size="xs"
                    weight="semibold"
                    className="uppercase text-muted-foreground"
                  >
                    Prepare
                  </Text>
                  <Heading4 className="mt-1 text-foreground">
                    Review before export
                  </Heading4>
                  <Text size="sm" className="mt-1 text-muted-foreground">
                    Check uncertain streaming matches, then export to a
                    connected service.
                  </Text>
                  <ExportReadinessMetrics
                    className="mt-5"
                    matchedCount={3}
                    reviewCount={1}
                  />
                </section>
              </m.div>
            ) : (
              <m.div
                key="ready"
                initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0, transition: { duration: 0.16 } }
                }
                transition={transition}
                className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-145">
                  <Text size="sm" weight="semibold" className="text-foreground">
                    The sample scoring window is ready.
                  </Text>
                  <Text size="sm" className="mt-1 text-muted-foreground">
                    Reveal the ranked tracks to see how repeated appearances
                    become confidence—and where a match still needs review.
                  </Text>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Text as="span" size="xs" weight="semibold">
                    Sample data ready
                  </Text>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </LazyMotion>
  )
}
