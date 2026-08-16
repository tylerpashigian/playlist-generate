import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { NavbarOffset, WithNavbar } from '@/components/product/product-navbar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Heading2, Heading3, Heading4, Text } from '@/components/ui/typography'
import { pageMetadata, siteUrl } from '@/lib/site-metadata'

/*
THESIS: An evidence-led field guide, not a marketing feature grid.
OWN-WORLD: Graphite type, porcelain ground, fog rules, and flat ledger-like sections.
STORY: Explain how recent setlists become inspectable playlist confidence, then clarify provider access.
FIRST VIEWPORT: Large explanation left; compact evidence ledger right; Build a playlist action beneath the introduction.
FORM: Field-guide narrative (Option A), paired with a separate Explore-first mobile drawer (Option C).
*/
export const Route = createFileRoute('/about')({
  head: () => ({
    meta: pageMetadata({
      title: 'About Encore | Evidence-based concert playlists',
      description:
        'Learn how Encore uses recent public setlists to create transparent, confidence-ranked playlists for the concert you’re heading to.',
      path: '/about',
    }),
    links: [{ rel: 'canonical', href: `${siteUrl}/about` }],
  }),
  component: AboutRoute,
})

const evidenceRows = [
  ['Recent shows', 'Newer performances carry more weight.'],
  ['Repeat appearances', 'Songs appearing across shows build confidence.'],
  ['Covers', 'Cover credit stays visible when the setlist identifies it.'],
] as const

const faqs = [
  {
    question: 'Why is Spotify limited to the beta?',
    answer:
      'We want to support Spotify for everyone, but Spotify currently limits Encore to invited beta testers. This is not a problem with your Spotify account, and there is no setting in Encore you can change to unlock it. If Spotify is not available to you, Apple Music is fully supported now.',
  },
  {
    question: 'Where does Encore get its setlist information?',
    answer:
      'Encore uses recent public Setlist.fm history. It considers up to 10 recent valid setlists, weighs newer shows more heavily, and returns up to 25 ranked tracks.',
  },
  {
    question: 'Is a playlist a prediction or the official setlist?',
    answer:
      'It is a transparent, evidence-based prediction. You can inspect confidence and appearance counts, then include or remove tracks before exporting.',
  },
  {
    question: 'Will Encore support other listening services?',
    answer:
      'Yes. Apple Music is fully supported now, alongside Spotify beta. Future services will appear as more destinations without changing how you build a playlist.',
  },
] as const

function AboutRoute() {
  return (
    <WithNavbar>
      <main className="min-h-dvh bg-background text-foreground">
        <NavbarOffset>
          <div className="mx-auto max-w-295 px-5 pb-16 pt-6 sm:px-8 sm:pt-14">
            <section className="grid gap-8 border-b border-border pb-10 md:grid-cols-2 md:items-start md:gap-16 md:pb-16">
              <div className="max-w-190 md:self-center">
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  About Encore
                </Text>
                <Heading2 className="mt-3 max-w-180 text-balance text-foreground">
                  Get ready for the set they’re most likely to play.
                </Heading2>
                <Text
                  size="lg"
                  className="mt-5 max-w-150 text-muted-foreground"
                >
                  Encore turns recent live-set history into a playlist you can
                  understand, tune, and take with you to the show.
                </Text>
                <Button asChild size="lg" className="mt-6 min-h-11">
                  <Link to="/app">
                    Build a playlist
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Link>
                </Button>
              </div>

              <section
                aria-labelledby="evidence-title"
                className="bg-muted/45 px-5 py-5 sm:px-6 sm:py-6 rounded-md"
              >
                <Text
                  as="span"
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  What a playlist can explain
                </Text>
                <Heading3 id="evidence-title" className="mt-3 max-w-100">
                  Every likely song has a trail back to the live show.
                </Heading3>
                <dl className="mt-5 divide-y divide-border border-t border-border">
                  {evidenceRows.map(([term, description]) => (
                    <div
                      key={term}
                      className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-4 sm:py-4"
                    >
                      <dt className="text-sm font-semibold text-foreground">
                        {term}
                      </dt>
                      <dd className="text-sm leading-5 text-muted-foreground">
                        {description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </section>

            <section className="grid gap-6 border-b border-border py-10 md:grid-cols-2 md:gap-16 md:py-20">
              <div>
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  Team
                </Text>
                <Heading2 className="type-heading-3 mt-3 max-w-100">
                  Built independently by Tyler Pashigian.
                </Heading2>
              </div>
              <div className="max-w-150">
                <Text size="lg" className="text-muted-foreground">
                  I made Encore because I kept building a setlist manually for
                  every concert I went to after combing through recent setlists
                  and a little guesswork. I wanted a faster way to turn recent
                  performances into something useful.
                </Text>
                <Text className="mt-4 text-muted-foreground">
                  It’s a small project, but I care about making the reasoning
                  visible. You should be able to see why a song made the
                  playlist, adjust it, and take it with you.
                </Text>
                <Button asChild size="sm" variant="outline" className="mt-5">
                  <a
                    href="https://www.tylerpashigian.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit Tyler’s site
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  </a>
                </Button>
              </div>
            </section>

            <section className="grid gap-6 py-10 md:grid-cols-2 md:gap-16 md:py-20">
              <div>
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  Built for a real decision
                </Text>
                <Heading2 className="type-heading-3 mt-3 max-w-110">
                  Recent evidence, not a black-box recommendation.
                </Heading2>
              </div>
              <div className="max-w-150 space-y-4 text-muted-foreground">
                <Text size="lg">
                  Encore looks at what an artist has been playing live lately,
                  then ranks songs using recency and repeat appearances. It is
                  designed for the question concertgoers actually have: “What
                  should I know before I get there?”
                </Text>
                <Text>
                  The result is always yours to review. Confidence, appearance
                  count, and cover attribution stay close to each track so you
                  can judge the evidence and make the final call.
                </Text>
              </div>
            </section>

            <section className="border-y border-border py-10 md:py-16">
              <div className="grid gap-6 md:grid-cols-2 md:gap-16">
                <div>
                  <Text
                    size="xs"
                    weight="semibold"
                    className="uppercase text-muted-foreground"
                  >
                    Streaming roadmap
                  </Text>
                  <Heading2 className="type-heading-3 mt-3 max-w-100">
                    The playlist comes first. The provider is the destination.
                  </Heading2>
                </div>
                <div className="divide-y divide-border border-t border-border">
                  <ProviderRow
                    label="Available now"
                    title="Apple Music"
                    description="Apple Music is fully supported now. Connect it, match your tracks, and export a playlist directly from Encore."
                  />
                  <ProviderRow
                    label="Available in beta"
                    title="Spotify"
                    description="We want to support Spotify for everyone, but Spotify currently limits Encore to invited beta testers."
                  />
                  <ProviderRow
                    label="Long term"
                    title="More ways to listen"
                    description="The goal is not a Spotify-shaped product. It is a clear path from live evidence to the service you use."
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-6 py-10 md:grid-cols-2 md:gap-16 md:py-20">
              <div>
                <Text
                  size="xs"
                  weight="semibold"
                  className="uppercase text-muted-foreground"
                >
                  Questions, answered
                </Text>
                <Heading2 className="type-heading-3 mt-3 max-w-90">
                  A few useful details before you begin.
                </Heading2>
              </div>
              <Accordion className="border-t border-border">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="gap-6 py-4 text-base font-semibold text-foreground hover:no-underline md:py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-140 text-muted-foreground">
                      <Text>{faq.answer}</Text>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </NavbarOffset>
      </main>
    </WithNavbar>
  )
}

function ProviderRow({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description: string
}) {
  return (
    <article className="grid gap-2 py-4 sm:grid-cols-2 sm:gap-6 sm:py-5">
      <Text
        as="span"
        size="xs"
        weight="semibold"
        className="uppercase text-muted-foreground"
      >
        {label}
      </Text>
      <div>
        <Heading4>{title}</Heading4>
        <Text className="mt-2 max-w-120 text-muted-foreground">
          {description}
        </Text>
      </div>
    </article>
  )
}
