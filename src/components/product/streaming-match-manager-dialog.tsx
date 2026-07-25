import { useEffect, useRef, useState } from 'react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
  StreamingTrackReviewSaveStatus,
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
  saveStatus: StreamingTrackReviewSaveStatus
  saveMessage: string | null
  searchErrorMessage: string | null
  saveErrorMessage: string | null
  unresolvedCount: number
  matchedCount: number
  skippedCount: number
  resolvedCount: number
  isReviewComplete: boolean
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
  onConfirm: () => Promise<void>
  onSkip: () => Promise<void>
  onRetrySave: () => Promise<void>
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
  saveStatus,
  saveMessage,
  searchErrorMessage,
  saveErrorMessage,
  unresolvedCount,
  matchedCount,
  skippedCount,
  resolvedCount,
  isReviewComplete,
  nextLabel,
  onOpenChange,
  onProviderChange,
  onTrackChange,
  onFilterChange,
  onTrackQueryChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onConfirm,
  onSkip,
  onRetrySave,
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
            Resolve uncertain recordings before exporting your playlist.
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
              unresolvedCount={unresolvedCount}
              resolvedCount={resolvedCount}
              isReviewComplete={isReviewComplete}
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
              saveStatus={saveStatus}
              saveMessage={saveMessage}
              searchErrorMessage={searchErrorMessage}
              saveErrorMessage={saveErrorMessage}
              unresolvedCount={unresolvedCount}
              matchedCount={matchedCount}
              skippedCount={skippedCount}
              resolvedCount={resolvedCount}
              trackCount={trackCount}
              isReviewComplete={isReviewComplete}
              nextLabel={nextLabel}
              onProviderChange={onProviderChange}
              onClearCandidates={onClearCandidates}
              onSearch={onSearch}
              onSelect={onSelect}
              onConfirm={onConfirm}
              onSkip={onSkip}
              onRetrySave={onRetrySave}
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
  saveStatus,
  saveMessage,
  searchErrorMessage,
  saveErrorMessage,
  unresolvedCount,
  matchedCount,
  skippedCount,
  resolvedCount,
  isReviewComplete,
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
  onConfirm,
  onSkip,
  onRetrySave,
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
        <DrawerHeader className="relative border-b border-border pb-4 pr-16 text-left">
          <div>
            <DrawerTitle className="type-heading-4">
              Manage track matches
            </DrawerTitle>
            <DrawerDescription>
              Resolve uncertain recordings before exporting your playlist.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            size="icon-lg"
            variant="ghost"
            aria-label="Close match manager"
            className="absolute right-3 top-1 size-11"
            onClick={() => onOpenChange(false)}
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={Cancel01Icon}
              strokeWidth={2}
            />
          </Button>
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
            <TabsTrigger value="tracks">
              Tracks · {unresolvedCount} remaining
            </TabsTrigger>
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
              unresolvedCount={unresolvedCount}
              resolvedCount={resolvedCount}
              isReviewComplete={isReviewComplete}
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
              saveStatus={saveStatus}
              saveMessage={saveMessage}
              searchErrorMessage={searchErrorMessage}
              saveErrorMessage={saveErrorMessage}
              unresolvedCount={unresolvedCount}
              matchedCount={matchedCount}
              skippedCount={skippedCount}
              resolvedCount={resolvedCount}
              trackCount={trackCount}
              isReviewComplete={isReviewComplete}
              nextLabel={nextLabel}
              onProviderChange={onProviderChange}
              onClearCandidates={onClearCandidates}
              onSearch={onSearch}
              onSelect={onSelect}
              onConfirm={onConfirm}
              onSkip={onSkip}
              onRetrySave={onRetrySave}
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
  unresolvedCount,
  resolvedCount,
  isReviewComplete,
  onFilterChange,
  onQueryChange,
  onTrackChange,
}: {
  trackRows: Array<StreamingTrackReviewRow>
  trackCount: number
  selectedTrackId: string | null
  filter: StreamingTrackReviewFilter
  query: string
  unresolvedCount: number
  resolvedCount: number
  isReviewComplete: boolean
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
          <div className="text-right">
            <Text size="xs" weight="semibold" className="text-foreground">
              {unresolvedCount > 0
                ? `${unresolvedCount} remaining`
                : 'All resolved'}
            </Text>
            <Text size="xs" className="text-muted-foreground">
              {resolvedCount} of {trackCount} resolved
            </Text>
          </div>
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
          <TrackBrowserEmptyState
            filter={filter}
            query={query}
            isReviewComplete={isReviewComplete}
            onFilterChange={onFilterChange}
            onQueryChange={onQueryChange}
          />
        )}
      </div>
    </section>
  )
}

function TrackBrowserEmptyState({
  filter,
  query,
  isReviewComplete,
  onFilterChange,
  onQueryChange,
}: {
  filter: StreamingTrackReviewFilter
  query: string
  isReviewComplete: boolean
  onFilterChange: (filter: StreamingTrackReviewFilter) => void
  onQueryChange: (query: string) => void
}) {
  return (
    <div className="grid justify-items-center gap-3 p-6 text-center">
      <div>
        <Text size="sm" weight="semibold" className="text-foreground">
          {isReviewComplete
            ? 'Every included track is resolved.'
            : 'No tracks match this view.'}
        </Text>
        <Text size="xs" className="mt-1 text-muted-foreground">
          {isReviewComplete
            ? 'Review another status or return to export.'
            : 'Clear the search or change the status filter.'}
        </Text>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {query ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onQueryChange('')}
          >
            Clear search
          </Button>
        ) : null}
        {filter !== 'all' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onFilterChange('all')}
          >
            Show all tracks
          </Button>
        ) : null}
      </div>
    </div>
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
        <span className="grid min-w-0 gap-1">
          <Text as="span" size="sm" weight="semibold" className="truncate">
            {row.track.title}
          </Text>
          <Text as="span" size="xs" className="truncate text-muted-foreground">
            {getTrackMatchDetail(row)}
          </Text>
        </span>
        <span
          className={cn(
            'flex items-center justify-end gap-2 text-right',
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
          <Text as="span" size="xs">
            {getStatusLabel(row.status)}
          </Text>
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
  saveStatus,
  saveMessage,
  searchErrorMessage,
  saveErrorMessage,
  unresolvedCount,
  matchedCount,
  skippedCount,
  resolvedCount,
  trackCount,
  isReviewComplete,
  nextLabel,
  onProviderChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onConfirm,
  onSkip,
  onRetrySave,
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
  saveStatus: StreamingTrackReviewSaveStatus
  saveMessage: string | null
  searchErrorMessage: string | null
  saveErrorMessage: string | null
  unresolvedCount: number
  matchedCount: number
  skippedCount: number
  resolvedCount: number
  trackCount: number
  isReviewComplete: boolean
  nextLabel: string
  onProviderChange: (provider: StreamingProvider | null) => void
  onClearCandidates: () => void
  onSearch: (query: string) => Promise<void>
  onSelect: (candidate: StreamingTrackCandidate) => Promise<void>
  onConfirm: () => Promise<void>
  onSkip: () => Promise<void>
  onRetrySave: () => Promise<void>
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

    void searchRef.current(debouncedQuery.trim()).catch(() => undefined)
  }, [debouncedQuery, selectedProvider, track])

  if (isReviewComplete) {
    return (
      <ReviewCompleteState
        providerName={providerName}
        matchedCount={matchedCount}
        skippedCount={skippedCount}
        trackCount={trackCount}
        onDone={onCancel}
      />
    )
  }

  if (!track) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center sm:p-6">
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
  const hasProposedMatch =
    currentMatch?.status === 'LOW_CONFIDENCE' &&
    Boolean(currentMatch.providerTrackId)

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid gap-4 p-4 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-4">
            <div className="grid gap-2">
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
                    <SelectItem
                      key={provider.provider}
                      value={provider.provider}
                    >
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {status ? <CurrentStatus status={status} /> : null}
          </div>

          <div className="sticky top-0 z-10 grid gap-2 bg-background py-2">
            <Label htmlFor={inputId}>
              {currentMatch?.trackName
                ? `Change the ${providerName ?? 'streaming'} match`
                : providerName
                  ? `Search ${providerName}`
                  : 'Search tracks'}
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
                  void onSelect(candidate).catch(() => undefined)
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

          {searchErrorMessage ? (
            <InlineOperationError
              message={searchErrorMessage}
              actionLabel="Retry search"
              onRetry={() => {
                const trimmedQuery = query.trim()
                if (trimmedQuery.length >= 2) {
                  void onSearch(trimmedQuery).catch(() => undefined)
                }
              }}
            />
          ) : null}

          <div>
            <Text size="xs" weight="semibold" className="text-muted-foreground">
              {unresolvedCount} unresolved · {resolvedCount} of {trackCount}{' '}
              resolved
            </Text>
            <Text size="lg" weight="semibold" className="mt-1">
              {track.title}
            </Text>
            <Text size="xs" className="mt-1 text-muted-foreground">
              {context}
            </Text>
          </div>

          <CurrentMatchSummary
            providerName={providerName}
            currentMatch={currentMatch}
          />
          {saveStatus !== 'idle' && saveStatus !== 'error' && saveMessage ? (
            <OperationFeedback status={saveStatus} message={saveMessage} />
          ) : null}

          <TrackMatchEvidence track={track} currentMatch={currentMatch} />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border p-5 sm:flex sm:justify-end sm:p-6">
        {saveErrorMessage ? (
          <div className="col-span-2 mb-2 sm:mb-0 sm:mr-auto">
            <InlineOperationError
              message={saveErrorMessage}
              actionLabel="Retry save"
              onRetry={() => void onRetrySave().catch(() => undefined)}
              compact
            />
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 sm:min-h-0"
          onClick={onCancel}
        >
          Done
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 sm:min-h-0"
          disabled={!selectedProvider || isSaving}
          onClick={() => void onSkip().catch(() => undefined)}
        >
          {providerName ? `Skip on ${providerName}` : 'Skip export'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="col-span-2 min-h-11 sm:min-h-0"
          disabled={!selectedProvider || isSaving}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
        {hasProposedMatch ? (
          <Button
            type="button"
            className="col-span-2 min-h-11 sm:min-h-0"
            disabled={!selectedProvider || isSaving}
            onClick={() => void onConfirm().catch(() => undefined)}
          >
            Confirm match
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function TrackMatchEvidence({
  track,
  currentMatch,
}: {
  track: PlaylistTrack
  currentMatch: TrackMatch | null
}) {
  const lastPlayedLabel = track.lastPlayedAt
    ? evidenceDateFormatter.format(track.lastPlayedAt)
    : 'Not available'
  const automaticMatchConfidence =
    currentMatch?.matchConfidenceScore == null
      ? 'Not available'
      : `${Math.round(currentMatch.matchConfidenceScore)}%`

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-border py-3 sm:grid-cols-4 sm:gap-y-3 sm:py-4">
      <EvidenceFact
        label="Recent appearances"
        value={`${track.appearanceCount} of ${track.totalSetlistsConsidered}`}
      />
      <EvidenceFact
        label="Setlist confidence"
        value={`${Math.round(track.confidenceScore)}%`}
      />
      <EvidenceFact label="Most recent" value={lastPlayedLabel} />
      <EvidenceFact
        label="Automatic match confidence"
        value={automaticMatchConfidence}
      />
    </dl>
  )
}

function EvidenceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt>
        <Text as="span" size="xs" className="text-muted-foreground">
          {label}
        </Text>
      </dt>
      <dd className="mt-1 truncate">
        <Text as="span" size="sm" weight="semibold" className="text-foreground">
          {value}
        </Text>
      </dd>
    </div>
  )
}

function CurrentMatchSummary({
  providerName,
  currentMatch,
}: {
  providerName: string | null
  currentMatch: TrackMatch | null
}) {
  const serviceName = providerName ?? 'streaming service'
  const hasProposedMatch = currentMatch?.status === 'LOW_CONFIDENCE'

  return (
    <div className="min-w-0">
      <Text size="xs" weight="semibold" className="text-muted-foreground">
        {hasProposedMatch ? 'Proposed' : 'Current'} {serviceName} match
      </Text>
      {currentMatch?.trackName ? (
        <>
          <Text
            size="sm"
            weight="semibold"
            className="mt-1 truncate text-foreground"
          >
            {currentMatch.trackName}
          </Text>
          <Text size="sm" className="mt-1 text-muted-foreground">
            {formatMatchMetadata(currentMatch)}
          </Text>
          {currentMatch.externalUrl ? (
            <a
              href={currentMatch.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-foreground underline underline-offset-3"
            >
              <Text as="span" size="xs" weight="semibold">
                Open in {serviceName}
              </Text>
            </a>
          ) : null}
        </>
      ) : (
        <Text size="sm" className="mt-1 text-muted-foreground">
          No provider recording is saved yet.
        </Text>
      )}
    </div>
  )
}

function OperationFeedback({
  status,
  message,
}: {
  status: StreamingTrackReviewSaveStatus
  message: string
}) {
  return (
    <Text
      as="div"
      role={status === 'error' ? 'alert' : 'status'}
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'border px-3 py-2',
        status === 'error'
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-border bg-muted/50 text-foreground',
      )}
    >
      {message}
    </Text>
  )
}

function InlineOperationError({
  message,
  actionLabel,
  onRetry,
  compact = false,
}: {
  message: string
  actionLabel: string
  onRetry: () => void
  compact?: boolean
}) {
  return (
    <div
      role="alert"
      className={cn(
        'mt-3 flex flex-col gap-2 border border-destructive/30 bg-destructive/5 p-3 text-destructive sm:flex-row sm:items-center sm:justify-between',
        compact ? 'mt-0' : '',
      )}
    >
      <Text size="xs" className="text-current">
        {message}
      </Text>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 border-destructive/30 bg-background text-foreground sm:min-h-0"
        onClick={onRetry}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

function ReviewCompleteState({
  providerName,
  matchedCount,
  skippedCount,
  trackCount,
  onDone,
}: {
  providerName: string | null
  matchedCount: number
  skippedCount: number
  trackCount: number
  onDone: () => void
}) {
  const serviceName = providerName ?? 'streaming service'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div className="w-full max-w-xl">
          <Text size="xs" weight="semibold" className="text-muted-foreground">
            Review complete
          </Text>
          <Text size="lg" weight="semibold" className="mt-2 text-foreground">
            All included tracks are resolved for {serviceName}.
          </Text>
          <Text size="sm" className="mt-2 text-muted-foreground">
            Your provider decisions are saved. Return to the export panel when
            you are ready to create the playlist.
          </Text>
          <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-4">
            <EvidenceFact label="Resolved" value={String(trackCount)} />
            <div className="pl-4">
              <EvidenceFact label="Matched" value={String(matchedCount)} />
            </div>
            <div className="pl-4">
              <EvidenceFact label="Skipped" value={String(skippedCount)} />
            </div>
          </dl>
        </div>
      </div>
      <div className="shrink-0 border-t border-border p-4 sm:flex sm:justify-end sm:p-6">
        <Button
          type="button"
          className="min-h-11 w-full sm:min-h-0 sm:w-auto"
          onClick={onDone}
        >
          Done — return to export
        </Button>
      </div>
    </div>
  )
}

function CurrentStatus({ status }: { status: StreamingTrackReviewStatus }) {
  return (
    <div className="grid content-start gap-2 self-end sm:self-auto">
      <Text size="sm" weight="semibold" className="sr-only sm:not-sr-only">
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
    <span className="grid min-w-0 flex-1 gap-1">
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
  return status === 'skipped' ? 'text-muted-foreground' : 'text-foreground'
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

function formatMatchMetadata(match: TrackMatch) {
  return [
    match.artistName,
    match.albumName,
    match.durationMs == null ? null : formatDuration(match.durationMs),
  ]
    .filter(Boolean)
    .join(' · ')
}

const evidenceDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const trackFilters: Array<{
  value: StreamingTrackReviewFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'review', label: 'Needs review' },
  { value: 'matched', label: 'Matched' },
  { value: 'skipped', label: 'Skipped' },
]
