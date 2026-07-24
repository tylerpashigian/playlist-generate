import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/typography'
import { useBreakpointValue } from '@/hooks/use-breakpoint-value'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type {
  StreamingTrackReviewFilter,
  StreamingTrackReviewRow,
  StreamingTrackReviewStatus,
} from '@/hooks/use-streaming-track-review'
import { cn } from '@/lib/utils'
import type { PlaylistTrack } from '@/models/playlists/models'
import type {
  StreamingProvider,
  StreamingTrackCandidate,
  TrackMatch,
} from '@/models/streaming/models'

interface ProviderOption {
  provider: StreamingProvider
  label: string
}

const matchManagerSurface = {
  base: 'drawer',
  lg: 'dialog',
} as const

interface StreamingMatchManagerDialogProps {
  open: boolean
  track: PlaylistTrack | null
  trackRows: Array<StreamingTrackReviewRow>
  trackCount: number
  selectedTrackStatus: StreamingTrackReviewStatus | null
  providers: Array<ProviderOption>
  selectedProvider: StreamingProvider | null
  filter: StreamingTrackReviewFilter
  trackQuery: string
  mobileView: 'tracks' | 'match'
  currentMatch: TrackMatch | null
  candidates: Array<StreamingTrackCandidate>
  isSearching: boolean
  isSaving: boolean
  nextLabel: string
  onOpenChange: (open: boolean) => void
  onProviderChange: (provider: StreamingProvider | null) => void
  onTrackChange: (trackId: string) => void
  onFilterChange: (filter: StreamingTrackReviewFilter) => void
  onTrackQueryChange: (query: string) => void
  onMobileViewChange: (view: 'tracks' | 'match') => void
  onClearCandidates: () => void
  onSearch: (query: string) => Promise<void>
  onSelect: (candidate: StreamingTrackCandidate) => Promise<void>
  onSkip: () => Promise<void>
  onNext: () => void
}

export function StreamingMatchManagerDialog(
  props: StreamingMatchManagerDialogProps,
) {
  const surface = useBreakpointValue(matchManagerSurface)

  if (surface === 'drawer') {
    return <MobileMatchManagerDrawer {...props} />
  }

  return <DesktopMatchManagerDialog {...props} />
}

function DesktopMatchManagerDialog({
  open,
  track,
  trackRows,
  trackCount,
  selectedTrackStatus,
  providers,
  selectedProvider,
  filter,
  trackQuery,
  currentMatch,
  candidates,
  isSearching,
  isSaving,
  nextLabel,
  onOpenChange,
  onProviderChange,
  onTrackChange,
  onFilterChange,
  onTrackQueryChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onSkip,
  onNext,
}: StreamingMatchManagerDialogProps) {
  const providerName =
    providers.find((option) => option.provider === selectedProvider)?.label ??
    null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        showCloseButton
        className="flex h-[calc(100dvh-2rem)] max-h-170 flex-col gap-0 overflow-hidden p-0 xl:max-h-208"
      >
        <DialogHeader className="relative shrink-0 border-b border-border px-5 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16">
          <DialogTitle>Manage track matches</DialogTitle>
          <DialogDescription>
            Choose any playlist track, then review its match for the selected
            streaming service.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex min-h-0 flex-1"
          data-testid="desktop-match-manager"
        >
          <div className="flex w-[38%] min-w-88 max-w-120 shrink-0 border-r border-border">
            <TrackBrowser
              trackRows={trackRows}
              trackCount={trackCount}
              selectedTrackId={track?.id ?? null}
              filter={filter}
              query={trackQuery}
              onFilterChange={onFilterChange}
              onQueryChange={onTrackQueryChange}
              onTrackChange={onTrackChange}
            />
          </div>
          <div className="flex min-w-0 flex-1">
            <MatchEditor
              key={`desktop:${track?.id ?? 'none'}:${selectedProvider ?? 'none'}`}
              inputId="desktop-streaming-track-search"
              selectId="desktop-streaming-service"
              track={track}
              status={selectedTrackStatus}
              providers={providers}
              selectedProvider={selectedProvider}
              providerName={providerName}
              currentMatch={currentMatch}
              candidates={candidates}
              isSearching={isSearching}
              isSaving={isSaving}
              nextLabel={nextLabel}
              onProviderChange={onProviderChange}
              onClearCandidates={onClearCandidates}
              onSearch={onSearch}
              onSelect={onSelect}
              onSkip={onSkip}
              onNext={onNext}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MobileMatchManagerDrawer({
  open,
  track,
  trackRows,
  trackCount,
  selectedTrackStatus,
  providers,
  selectedProvider,
  filter,
  trackQuery,
  mobileView,
  currentMatch,
  candidates,
  isSearching,
  isSaving,
  nextLabel,
  onOpenChange,
  onProviderChange,
  onTrackChange,
  onFilterChange,
  onTrackQueryChange,
  onMobileViewChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onSkip,
  onNext,
}: StreamingMatchManagerDialogProps) {
  const providerName =
    providers.find((option) => option.provider === selectedProvider)?.label ??
    null

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle
      swipeDirection="down"
    >
      <DrawerContent className="[--drawer-height:calc(100dvh-1rem)] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-1rem)]">
        <DrawerHeader className="border-b border-border pb-4 text-left">
          <DrawerTitle className="type-heading-4">
            Manage track matches
          </DrawerTitle>
          <DrawerDescription>
            Choose any playlist track, then review its match for the selected
            streaming service.
          </DrawerDescription>
        </DrawerHeader>

        <Tabs
          value={mobileView}
          onValueChange={(value) =>
            onMobileViewChange(value as 'tracks' | 'match')
          }
          className="min-h-0 flex-1 flex-col gap-0"
          data-testid="mobile-match-manager"
        >
          <TabsList className="mx-5 mt-4 w-[calc(100%-2.5rem)] shrink-0">
            <TabsTrigger value="tracks">Tracks · {trackCount}</TabsTrigger>
            <TabsTrigger value="match">Match</TabsTrigger>
          </TabsList>

          <TabsContent
            value="tracks"
            keepMounted
            className="flex min-h-0 data-hidden:hidden"
          >
            <TrackBrowser
              trackRows={trackRows}
              trackCount={trackCount}
              selectedTrackId={track?.id ?? null}
              filter={filter}
              query={trackQuery}
              onFilterChange={onFilterChange}
              onQueryChange={onTrackQueryChange}
              onTrackChange={onTrackChange}
            />
          </TabsContent>

          <TabsContent
            value="match"
            keepMounted
            className="flex min-h-0 data-hidden:hidden"
          >
            <MatchEditor
              key={`mobile:${track?.id ?? 'none'}:${selectedProvider ?? 'none'}`}
              inputId="mobile-streaming-track-search"
              selectId="mobile-streaming-service"
              track={track}
              status={selectedTrackStatus}
              providers={providers}
              selectedProvider={selectedProvider}
              providerName={providerName}
              currentMatch={currentMatch}
              candidates={candidates}
              isSearching={isSearching}
              isSaving={isSaving}
              nextLabel={nextLabel}
              onProviderChange={onProviderChange}
              onClearCandidates={onClearCandidates}
              onSearch={onSearch}
              onSelect={onSelect}
              onSkip={onSkip}
              onNext={onNext}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}

function TrackBrowser({
  trackRows,
  trackCount,
  selectedTrackId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onTrackChange,
}: {
  trackRows: Array<StreamingTrackReviewRow>
  trackCount: number
  selectedTrackId: string | null
  filter: StreamingTrackReviewFilter
  query: string
  onFilterChange: (filter: StreamingTrackReviewFilter) => void
  onQueryChange: (query: string) => void
  onTrackChange: (trackId: string) => void
}) {
  return (
    <section className="flex min-h-0 w-full flex-col">
      <div className="grid shrink-0 gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <Text size="sm" weight="semibold">
            Playlist tracks
          </Text>
          <Text size="xs" className="text-muted-foreground">
            {trackCount} included
          </Text>
        </div>
        <Input
          type="search"
          value={query}
          aria-label="Find a playlist track"
          placeholder="Find a track"
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
        <div className="flex gap-1 overflow-x-auto pb-1">
          {trackFilters.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filter === option.value ? 'default' : 'outline'}
              aria-pressed={filter === option.value}
              className="shrink-0"
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {trackRows.length ? (
          <ol>
            {trackRows.map((row) => (
              <TrackBrowserRow
                key={row.track.id}
                row={row}
                selected={row.track.id === selectedTrackId}
                onSelect={onTrackChange}
              />
            ))}
          </ol>
        ) : (
          <div className="p-6 text-center">
            <Text size="sm" className="text-muted-foreground">
              No tracks match this view.
            </Text>
          </div>
        )}
      </div>
    </section>
  )
}

function TrackBrowserRow({
  row,
  selected,
  onSelect,
}: {
  row: StreamingTrackReviewRow
  selected: boolean
  onSelect: (trackId: string) => void
}) {
  const trackId = row.track.id

  if (!trackId) {
    return null
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        className={cn(
          'grid w-full grid-cols-[2rem_minmax(0,1fr)_5.5rem] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50',
          selected ? 'bg-accent' : 'bg-background',
        )}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(trackId)}
      >
        <Text as="span" size="xs" className="text-muted-foreground">
          {String(row.track.position).padStart(2, '0')}
        </Text>
        <span className="grid min-w-0 gap-0.5">
          <Text as="span" size="sm" weight="semibold" className="truncate">
            {row.track.title}
          </Text>
          <Text as="span" size="xs" className="truncate text-muted-foreground">
            {getTrackMatchDetail(row)}
          </Text>
        </span>
        <span
          className={cn(
            'flex items-center justify-end gap-1.5 text-right text-xs',
            getStatusTextClass(row.status),
          )}
        >
          <span
            aria-hidden
            className={cn(
              'size-1.5 rounded-full',
              getStatusDotClass(row.status),
            )}
          />
          {getStatusLabel(row.status)}
        </span>
      </button>
    </li>
  )
}

function MatchEditor({
  inputId,
  selectId,
  track,
  status,
  providers,
  selectedProvider,
  providerName,
  currentMatch,
  candidates,
  isSearching,
  isSaving,
  nextLabel,
  onProviderChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onSkip,
  onNext,
  onCancel,
}: {
  inputId: string
  selectId: string
  track: PlaylistTrack | null
  status: StreamingTrackReviewStatus | null
  providers: Array<ProviderOption>
  selectedProvider: StreamingProvider | null
  providerName: string | null
  currentMatch: TrackMatch | null
  candidates: Array<StreamingTrackCandidate>
  isSearching: boolean
  isSaving: boolean
  nextLabel: string
  onProviderChange: (provider: StreamingProvider | null) => void
  onClearCandidates: () => void
  onSearch: (query: string) => Promise<void>
  onSelect: (candidate: StreamingTrackCandidate) => Promise<void>
  onSkip: () => Promise<void>
  onNext: () => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const searchRef = useRef(onSearch)

  useEffect(() => {
    searchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (!track || !selectedProvider || debouncedQuery.trim().length < 2) {
      return
    }

    void searchRef.current(debouncedQuery.trim())
  }, [debouncedQuery, selectedProvider, track])

  if (!track) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <Text size="sm" className="text-muted-foreground">
          Select a track to manage its streaming match.
        </Text>
      </div>
    )
  }

  const context =
    track.isCover && track.originalArtistName
      ? `Performed as a cover of ${track.originalArtistName}.`
      : 'Select the intended recording from the provider catalog.'

  return (
    <section className="flex min-h-0 w-full flex-col">
      <div className="grid shrink-0 gap-4 border-b border-border p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="grid gap-1.5">
            <Label htmlFor={selectId}>Streaming service</Label>
            <Select<StreamingProvider>
              value={selectedProvider}
              onValueChange={onProviderChange}
              disabled={isSaving}
            >
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue placeholder="Select a streaming service">
                  {providerName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.provider} value={provider.provider}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status ? <CurrentStatus status={status} /> : null}
        </div>

        <div>
          <Text size="lg" weight="semibold">
            {track.title}
          </Text>
          <Text size="xs" className="mt-1 text-muted-foreground">
            {context}
          </Text>
          {currentMatch?.trackName ? (
            <Text size="xs" className="mt-1 text-muted-foreground">
              Current match: {currentMatch.trackName}
              {currentMatch.artistName ? ` · ${currentMatch.artistName}` : ''}
            </Text>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="flex min-h-full flex-col">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId}>
              {providerName ? `Search ${providerName}` : 'Search tracks'}
            </Label>
            <Combobox<StreamingTrackCandidate>
              items={candidates}
              filteredItems={candidates}
              filter={null}
              inputValue={query}
              onInputValueChange={(nextQuery) => {
                setQuery(nextQuery)

                if (nextQuery.trim().length < 2) {
                  onClearCandidates()
                }
              }}
              value={null}
              onValueChange={(candidate) => {
                if (candidate) {
                  void onSelect(candidate)
                }
              }}
              itemToStringLabel={(candidate) => candidate.title}
              itemToStringValue={(candidate) => candidate.providerTrackId}
              isItemEqualToValue={(item, value) =>
                item.providerTrackId === value.providerTrackId
              }
            >
              <ComboboxInput
                id={inputId}
                className="w-full"
                aria-label={
                  providerName ? `Search ${providerName}` : 'Search tracks'
                }
                placeholder={
                  providerName
                    ? 'Track title, artist, or album'
                    : 'Select a streaming service first'
                }
                disabled={!selectedProvider || isSaving}
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {isSearching
                    ? `Searching ${providerName ?? 'tracks'}`
                    : query.trim().length < 2
                      ? 'Type at least 2 characters.'
                      : `No ${providerName ?? 'streaming'} tracks found.`}
                </ComboboxEmpty>
                <ComboboxList>
                  {(candidate) => (
                    <ComboboxItem
                      key={`${candidate.provider}:${candidate.providerTrackId}`}
                      value={candidate}
                      disabled={isSaving}
                    >
                      <StreamingTrackCandidateResult candidate={candidate} />
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {!query.trim() && !isSearching ? (
            <MatchSearchEmptyState
              providerName={providerName}
              hasCurrentMatch={Boolean(currentMatch)}
            />
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end sm:p-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedProvider || isSaving}
          onClick={() => void onSkip()}
        >
          {providerName ? `Do not export to ${providerName}` : 'Skip export'}
        </Button>
        <Button
          type="button"
          disabled={!selectedProvider || isSaving}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </section>
  )
}

function MatchSearchEmptyState({
  providerName,
  hasCurrentMatch,
}: {
  providerName: string | null
  hasCurrentMatch: boolean
}) {
  const serviceName = providerName ?? 'streaming service'

  return (
    <Empty className="hidden min-h-64 border-0 px-6 py-10 lg:flex">
      <EmptyHeader>
        <EmptyTitle>
          {hasCurrentMatch
            ? `Replace the current ${serviceName} match`
            : 'Find the intended recording'}
        </EmptyTitle>
        <EmptyDescription>
          Search by track title, artist, or album to{' '}
          {hasCurrentMatch
            ? 'choose a different recording.'
            : `resolve this ${serviceName} match.`}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function CurrentStatus({ status }: { status: StreamingTrackReviewStatus }) {
  return (
    <div className="grid content-start gap-1.5">
      <Text size="sm" weight="semibold">
        Current status
      </Text>
      <div
        className={cn(
          'flex h-9 items-center gap-2 rounded-md bg-muted px-3',
          getStatusTextClass(status),
        )}
      >
        <span
          aria-hidden
          className={cn('size-2 rounded-full', getStatusDotClass(status))}
        />
        <Text as="span" size="sm" weight="medium">
          {getStatusLabel(status)}
        </Text>
      </div>
    </div>
  )
}

function StreamingTrackCandidateResult({
  candidate,
}: {
  candidate: StreamingTrackCandidate
}) {
  return (
    <span className="grid min-w-0 flex-1 gap-0.5">
      <Text as="span" size="sm" weight="semibold" className="truncate">
        {candidate.title}
      </Text>
      <Text as="span" size="xs" className="truncate text-muted-foreground">
        {candidate.artistName} · {candidate.albumName}
      </Text>
      <Text as="span" size="xs" className="text-muted-foreground">
        {formatDuration(candidate.durationMs)}
      </Text>
    </span>
  )
}

function getTrackMatchDetail(row: StreamingTrackReviewRow) {
  if (row.status === 'skipped') {
    return 'Not included in this provider export'
  }

  if (!row.match?.trackName) {
    return 'No confident match'
  }

  return [row.match.trackName, row.match.artistName].filter(Boolean).join(' · ')
}

function getStatusLabel(status: StreamingTrackReviewStatus) {
  switch (status) {
    case 'matched':
      return 'Matched'
    case 'skipped':
      return 'Skipped'
    default:
      return 'Needs review'
  }
}

function getStatusTextClass(status: StreamingTrackReviewStatus) {
  switch (status) {
    case 'matched':
      return 'text-success'
    case 'skipped':
      return 'text-muted-foreground'
    default:
      return 'text-review'
  }
}

function getStatusDotClass(status: StreamingTrackReviewStatus) {
  switch (status) {
    case 'matched':
      return 'bg-success'
    case 'skipped':
      return 'bg-muted-foreground'
    default:
      return 'bg-review'
  }
}

function formatDuration(durationMs: number) {
  const seconds = Math.round(durationMs / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const trackFilters: Array<{
  value: StreamingTrackReviewFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'review', label: 'Needs review' },
  { value: 'matched', label: 'Matched' },
  { value: 'skipped', label: 'Skipped' },
]
