import { m } from 'motion/react'

import { Heading2, Text } from '@/components/ui/typography'

const confidenceRows = [
  {
    title: 'Innerbloom',
    evidence: '10 of 10 setlists',
    confidence: '100',
  },
  {
    title: 'Surrender',
    evidence: '8 of 10 setlists',
    confidence: '85',
  },
  {
    title: 'Levitating',
    evidence: '6 of 10 setlists',
    confidence: '67',
  },
] as const

export function LandingInspectableEvidenceSection({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean
}) {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto grid w-full max-w-295 gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-32">
        <div>
          <Text
            as="span"
            size="xs"
            weight="semibold"
            className="text-background/55"
          >
            Inspectable by design
          </Text>
          <Heading2 className="mt-5 max-w-160 text-balance">
            The score tells you what Encore thinks.{' '}
            <span className="text-background/45">
              The evidence tells you why.
            </span>
          </Heading2>
          <Text className="mt-6 max-w-130 text-background/60">
            Appearance counts sit beside confidence, so you can spot
            certainties, rotations, and tracks that deserve a second look.
          </Text>
        </div>

        <m.div
          viewport={{ once: true, amount: 0.35 }}
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          className="border-y border-background/20"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-background/20 py-3">
            <Text size="xs" weight="semibold" className="text-background/55">
              Ranked sample
            </Text>
            <Text size="xs" weight="semibold" className="text-background/55">
              Confidence
            </Text>
          </div>
          {confidenceRows.map((row, index) => (
            <m.div
              key={row.title}
              variants={{
                hidden: { opacity: 0.35, x: 18 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                delay: shouldReduceMotion ? 0 : index * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-background/20 py-5 last:border-b-0"
            >
              <Text as="span" size="xs" className="text-background/45">
                {String(index + 1).padStart(2, '0')}
              </Text>
              <div>
                <Text as="span" weight="semibold">
                  {row.title}
                </Text>
                <Text size="xs" className="mt-1 text-background/55">
                  {row.evidence}
                </Text>
              </div>
              <span className="text-4xl font-semibold tracking-[-0.035em]">
                {row.confidence}
              </span>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  )
}
