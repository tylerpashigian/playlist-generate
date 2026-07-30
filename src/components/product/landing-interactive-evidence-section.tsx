import { LandingSetlistDemo } from '@/components/product/landing-setlist-demo'
import { Heading2, Text } from '@/components/ui/typography'

export function LandingInteractiveEvidenceSection() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-260">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <Heading2 className="max-w-175 text-balance">
            Don&apos;t take the prediction on faith.{' '}
            <span className="text-muted-foreground">Open the evidence.</span>
          </Heading2>
          <Text className="max-w-88 text-muted-foreground lg:justify-self-end">
            Reveal the sample to watch recency weights become a ranked,
            reviewable playlist.
          </Text>
        </div>
        <LandingSetlistDemo />
      </div>
    </section>
  )
}
