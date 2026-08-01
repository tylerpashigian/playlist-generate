import { Heading2, Heading4, Text } from '@/components/ui/typography'

const workflowSteps = [
  {
    title: 'Find the artist',
    description:
      'Encore pulls recent public setlist history instead of starting with streams, charts, or taste profiles.',
    note: 'Recent live history',
  },
  {
    title: 'Weight the evidence',
    description:
      'Repeated songs rise through the list, while newer shows contribute more to each confidence score.',
    note: 'Recency weighted',
  },
  {
    title: 'Make it yours',
    description:
      'Review likely songs, remove the misses, check uncertain matches, and export when the playlist feels right.',
    note: 'Human reviewed',
  },
] as const

export function LandingWorkflowSection() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto grid w-full max-w-295 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-border py-16 lg:border-r lg:border-b-0 lg:py-24 lg:pr-16">
          <Text
            as="span"
            size="xs"
            weight="semibold"
            className="text-muted-foreground"
          >
            From search to show
          </Text>
          <Heading2 className="mt-4 max-w-125 text-balance">
            A shorter path to feeling prepared.
          </Heading2>
          <Text className="mt-5 max-w-110 text-muted-foreground">
            Encore keeps the machinery visible and the decisions yours. No
            mystery mix, no provider lock-in.
          </Text>
        </div>

        <div className="lg:pl-16">
          {workflowSteps.map((step, index) => (
            <article
              key={step.title}
              className="grid gap-5 border-b border-border py-9 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start lg:py-11"
            >
              <Text
                as="span"
                size="sm"
                weight="semibold"
                className="text-muted-foreground"
              >
                {String(index + 1).padStart(2, '0')}
              </Text>
              <div>
                <Heading4>{step.title}</Heading4>
                <Text
                  size="sm"
                  className="mt-2 max-w-120 text-muted-foreground"
                >
                  {step.description}
                </Text>
              </div>
              <Text
                as="span"
                size="xs"
                weight="semibold"
                className="w-fit rounded-full border border-border px-3 py-1.5 text-muted-foreground"
              >
                {step.note}
              </Text>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
