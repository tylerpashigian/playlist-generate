import { Skeleton } from '@/components/ui/skeleton'

const loadingTracks = [
  { titleWidth: 'w-44', detailWidth: 'w-28', scoreWidth: 'w-18' },
  { titleWidth: 'w-56', detailWidth: 'w-36', scoreWidth: 'w-16' },
  { titleWidth: 'w-40', detailWidth: 'w-24', scoreWidth: 'w-20' },
  { titleWidth: 'w-52', detailWidth: 'w-32', scoreWidth: 'w-17' },
  { titleWidth: 'w-48', detailWidth: 'w-28', scoreWidth: 'w-18' },
] as const

export function PlaylistDetailLoading() {
  return (
    <>
      <output aria-live="polite" className="sr-only">
        Loading playlist details
      </output>

      <section
        aria-hidden="true"
        className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8"
      >
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-3/4 max-w-96" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-80" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
      </section>

      <section
        aria-hidden="true"
        className="grid grid-cols-1 gap-6 pt-6 sm:gap-8 sm:pt-8 lg:grid-cols-5"
      >
        <PlaylistTracksLoading />
        <ExportActionsLoading />
      </section>
    </>
  )
}

function PlaylistTracksLoading() {
  return (
    <section className="col-span-1 min-w-0 lg:col-span-3">
      <div>
        <Skeleton className="h-7 w-56 max-w-3/4" />
        <Skeleton className="mt-1 h-5 w-72 max-w-full" />
      </div>

      <ol
        aria-label="Loading playlist tracks"
        className="mt-4 grid gap-2 rounded-xl"
      >
        {loadingTracks.map((track, index) => (
          <li
            key={`${track.titleWidth}-${index}`}
            className="overflow-hidden rounded-lg border border-border bg-background"
          >
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 p-3">
              <Skeleton className="h-4 w-5" />
              <div className="grid min-w-0 gap-1">
                <Skeleton className={`h-5 max-w-full ${track.titleWidth}`} />
                <Skeleton className={`h-4 max-w-full ${track.detailWidth}`} />
              </div>
              <Skeleton className={`h-11 ${track.scoreWidth}`} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ExportActionsLoading() {
  return (
    <aside className="col-span-1 min-w-0 border-t border-border pt-6 sm:pt-8 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-1 h-7 w-44 max-w-full" />
      <div className="mt-1 grid gap-1">
        <Skeleton className="h-5 w-full max-w-80" />
        <Skeleton className="h-5 w-3/4 max-w-64" />
      </div>

      <div className="mt-5 grid gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>

      <Skeleton className="mt-5 h-5 w-full max-w-72" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-background p-4"
          >
            <Skeleton className="h-7 w-10" />
            <Skeleton className="mt-1 h-5 w-24 max-w-full" />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </aside>
  )
}
