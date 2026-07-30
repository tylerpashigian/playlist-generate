import { Link } from '@tanstack/react-router'
import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { m } from 'motion/react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Heading1, Text } from '@/components/ui/typography'

const recentShows = [
  { city: 'Sydney', date: 'Jul 24', weight: 100 },
  { city: 'Melbourne', date: 'Jul 21', weight: 88 },
  { city: 'Auckland', date: 'Jul 18', weight: 76 },
  { city: 'Brisbane', date: 'Jul 15', weight: 64 },
] as const

const evidenceFacts = [
  { value: '10', label: 'recent valid setlists considered' },
  { value: '25', label: 'ranked tracks at most' },
  { value: '100%', label: 'visible confidence evidence' },
] as const

export function LandingHeroSection({
  authAction,
  shouldReduceMotion,
}: {
  authAction: ReactNode
  shouldReduceMotion: boolean
}) {
  const heroTransition = {
    duration: shouldReduceMotion ? 0 : 0.7,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  }
  const frameLineTransition = (delay: number) => ({
    duration: shouldReduceMotion ? 0 : 0.5,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  })

  return (
    <>
      <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        >
          <div className="mx-auto grid h-full w-full max-w-305 grid-cols-12 gap-8 px-8">
            <m.span
              className="col-start-1 origin-top border-l border-border/60"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleY: 0.2, y: -12 }
              }
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              transition={frameLineTransition(0.03)}
            />
            <m.span
              className="col-start-7 origin-top border-r border-border/60"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleY: 0.2, y: -12 }
              }
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              transition={frameLineTransition(0.08)}
            />
            <m.span
              className="col-start-9 origin-top border-l border-border/60"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleY: 0.2, y: -12 }
              }
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              transition={frameLineTransition(0.13)}
            />
            <m.span
              className="col-start-12 origin-top border-r border-border/60"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleY: 0.2, y: -12 }
              }
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              transition={frameLineTransition(0.18)}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-305 gap-14 px-5 pb-16 sm:px-8 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:pb-28">
          <m.div
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 24, filter: 'blur(8px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={heroTransition}
            className="relative lg:col-span-7 lg:px-2"
          >
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute -top-7 inset-x-0 hidden origin-left border-t border-border/60 lg:block"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleX: 0.15 }
              }
              animate={{ opacity: 1, scaleX: 1 }}
              transition={frameLineTransition(0.14)}
            />
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-7 inset-x-0 hidden origin-left border-t border-border/60 lg:block"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scaleX: 0.15 }
              }
              animate={{ opacity: 1, scaleX: 1 }}
              transition={frameLineTransition(0.26)}
            />
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="relative flex size-2 items-center justify-center"
              >
                <span className="absolute size-2 animate-ping rounded-full bg-success opacity-35 motion-reduce:animate-none" />
                <span className="relative size-1.5 rounded-full bg-success" />
              </span>
              <Text
                as="span"
                size="xs"
                weight="semibold"
                className="uppercase tracking-[0.08em] text-muted-foreground"
              >
                Built from recent live shows
              </Text>
            </div>

            <Heading1 className="mt-7 max-w-190 text-balance">
              Know what they&apos;re playing{' '}
              <span className="text-muted-foreground">before you go.</span>
            </Heading1>

            <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Text size="lg" className="max-w-145 text-muted-foreground">
                Search an artist, generate a confidence-ranked playlist from
                recent setlists, and walk into the show ready for the songs most
                likely to land.
              </Text>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="group min-h-11 px-4">
                  <Link to="/app">
                    Start a playlist
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                </Button>
                {authAction}
              </div>
            </div>
          </m.div>

          <m.aside
            aria-label="A sample of the recent shows Encore weighs"
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, x: 22, clipPath: 'inset(0 0 0 14%)' }
            }
            animate={{ opacity: 1, x: 0, clipPath: 'inset(0 0 0 0%)' }}
            transition={{
              ...heroTransition,
              delay: shouldReduceMotion ? 0 : 0.12,
            }}
            className="self-end border-y border-border lg:col-span-4 lg:col-start-9"
          >
            <div className="flex items-center justify-between border-b border-border py-3 px-2">
              <Text size="xs" weight="semibold">
                Recent show ledger
              </Text>
              <Text size="xs" className="text-muted-foreground">
                Newest first
              </Text>
            </div>

            <div className="px-2">
              {recentShows.map((show, index) => (
                <div
                  key={`${show.city}-${show.date}`}
                  className="group grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <Text as="span" size="xs" className="text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <Text as="span" size="sm" weight="semibold">
                        {show.city}
                      </Text>
                      <Text
                        as="span"
                        size="xs"
                        className="text-muted-foreground"
                      >
                        {show.date}
                      </Text>
                    </div>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                      <m.span
                        aria-hidden="true"
                        className="block h-full origin-left rounded-full bg-foreground"
                        initial={shouldReduceMotion ? false : { scaleX: 0 }}
                        animate={{ scaleX: show.weight / 100 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.55,
                          delay: shouldReduceMotion ? 0 : 0.28 + index * 0.07,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </span>
                  </div>
                  <Text
                    as="span"
                    size="xs"
                    weight="semibold"
                    className="text-right text-muted-foreground transition-colors duration-150 ease group-hover:text-foreground motion-reduce:transition-none"
                  >
                    {show.weight}%
                  </Text>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border py-3 px-2 text-success">
              <HugeiconsIcon
                aria-hidden="true"
                icon={Tick02Icon}
                strokeWidth={2}
                className="size-4"
              />
              <Text as="span" size="xs" weight="semibold">
                Evidence window ready
              </Text>
            </div>
          </m.aside>
        </div>
      </section>

      <section
        aria-label="How Encore builds a playlist"
        className="border-y border-border bg-muted/30"
      >
        <div className="mx-auto grid w-full max-w-295 divide-y divide-border px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {evidenceFacts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline gap-3 py-4 sm:px-5 sm:first:pl-0 sm:last:pr-0"
            >
              <Text as="span" size="lg" weight="semibold">
                {fact.value}
              </Text>
              <Text as="span" size="xs" className="text-muted-foreground">
                {fact.label}
              </Text>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
