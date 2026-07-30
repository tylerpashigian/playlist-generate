import { Link } from '@tanstack/react-router'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Button } from '@/components/ui/button'
import { Heading2 } from '@/components/ui/typography'

export function LandingFinalCtaSection() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-295 gap-10 border-y border-border py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:py-16">
        <Heading2 className="max-w-205 text-balance">
          Your next show has a playlist waiting.
        </Heading2>
        <Button asChild size="lg" className="group min-h-12 w-fit px-5">
          <Link to="/app">
            Build it now
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="transition-transform duration-150 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
            />
          </Link>
        </Button>
      </div>
    </section>
  )
}
