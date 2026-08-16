import { Link, createFileRoute } from '@tanstack/react-router'
import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'

import Footer from '@/components/Footer'
import { LandingFinalCtaSection } from '@/components/product/landing-final-cta-section'
import { LandingHeroSection } from '@/components/product/landing-hero-section'
import { LandingInspectableEvidenceSection } from '@/components/product/landing-inspectable-evidence-section'
import { LandingInteractiveEvidenceSection } from '@/components/product/landing-interactive-evidence-section'
import { LandingWorkflowSection } from '@/components/product/landing-workflow-section'
import { WithNavbar } from '@/components/product/product-navbar'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/hooks/use-auth-session'
import { pageMetadata, siteUrl } from '@/lib/site-metadata'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: pageMetadata({
      title: 'Encore | Get ready for the set they’re most likely to play',
      description:
        'Build an evidence-based concert playlist from an artist’s recent setlists, then export it to your favorite streaming service.',
      path: '/',
    }),
    links: [{ rel: 'canonical', href: `${siteUrl}/` }],
  }),
  component: LandingRoute,
})

function LandingRoute() {
  const { isAuthenticated, isSessionLoading, isSignedIn } = useAuthSession()
  const shouldReduceMotion = Boolean(useReducedMotion())

  const authAction =
    !isSignedIn && !isSessionLoading ? (
      <Button asChild size="lg" variant="outline" className="min-h-11">
        <Link to="/auth">Sign in</Link>
      </Button>
    ) : isSignedIn && !isAuthenticated ? (
      <Button asChild size="lg" variant="outline" className="min-h-11">
        <Link
          to="/auth"
          search={{ redirect: '/app', verificationRequired: true }}
        >
          Verify email
        </Link>
      </Button>
    ) : null

  return (
    <WithNavbar>
      <main className="w-full overflow-hidden bg-background text-foreground">
        <LazyMotion features={domAnimation}>
          <LandingHeroSection
            authAction={authAction}
            shouldReduceMotion={shouldReduceMotion}
          />
          <LandingInteractiveEvidenceSection />
          <LandingWorkflowSection />
          <LandingInspectableEvidenceSection
            shouldReduceMotion={shouldReduceMotion}
          />
          <LandingFinalCtaSection />
        </LazyMotion>
      </main>
      <Footer />
    </WithNavbar>
  )
}
