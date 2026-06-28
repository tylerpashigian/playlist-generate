import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: LandingRoute })

function LandingRoute() {
  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="rise-in rounded-2xl border border-border bg-card px-6 py-10 text-card-foreground shadow-sm sm:px-10 sm:py-14">
        <p className="mb-3 text-sm font-bold text-muted-foreground">
          Setlist-based playlist builder
        </p>
        <h1 className="mb-5 max-w-3xl font-heading text-4xl leading-[1.02] font-bold tracking-tight text-foreground sm:text-6xl">
          Build playlists from what artists are actually playing.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Search an artist, generate a ranked setlist playlist with confidence
          scores, then export it to Spotify when you are ready.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app">Open app</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            'Artist search',
            'Find the artist you are seeing and start from Setlist.fm data.',
          ],
          [
            'Confidence scores',
            'Rank songs by how often they appear in recent shows.',
          ],
          [
            'Saved playlists',
            'Keep generated playlists tied to your app account.',
          ],
          [
            'Spotify export',
            'Connect Spotify as a provider without making it your app login.',
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="rise-in rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {title}
            </h2>
            <p className="m-0 text-sm text-muted-foreground">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
