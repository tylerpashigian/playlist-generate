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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Text } from '@/components/ui/typography'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
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

export function StreamingTrackMatchDialog({
  open,
  track,
  providers,
  selectedProvider,
  isProviderLocked,
  currentMatch,
  candidates,
  isSearching,
  isSaving,
  onOpenChange,
  onProviderChange,
  onClearCandidates,
  onSearch,
  onSelect,
  onSkip,
  onNext,
}: {
  open: boolean
  track: PlaylistTrack | null
  providers: Array<ProviderOption>
  selectedProvider: StreamingProvider | null
  isProviderLocked: boolean
  currentMatch: TrackMatch | null
  candidates: Array<StreamingTrackCandidate>
  isSearching: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onProviderChange: (provider: StreamingProvider | null) => void
  onClearCandidates: () => void
  onSearch: (query: string) => Promise<void>
  onSelect: (candidate: StreamingTrackCandidate) => Promise<void>
  onSkip: () => Promise<void>
  onNext: () => void
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const searchRef = useRef(onSearch)
  const providerName =
    providers.find((option) => option.provider === selectedProvider)?.label ??
    null

  useEffect(() => {
    searchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (!open || !track || !selectedProvider || debouncedQuery.trim().length < 2) {
      return
    }

    void searchRef.current(debouncedQuery.trim())
  }, [debouncedQuery, open, selectedProvider, track])

  useEffect(() => {
    setQuery('')
  }, [open, selectedProvider, track?.id])

  if (!track) {
    return null
  }

  const context =
    track.isCover && track.originalArtistName
      ? `Performed as a cover of ${track.originalArtistName}.`
      : 'Choose a streaming service and select the intended recording.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review “{track.title}”</DialogTitle>
          <DialogDescription>{context}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="streaming-service">Streaming service</Label>
            <Select<StreamingProvider>
              value={selectedProvider}
              onValueChange={onProviderChange}
              disabled={isProviderLocked || isSaving}
            >
              <SelectTrigger id="streaming-service" className="w-full">
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

          {currentMatch && providerName ? (
            <Text size="xs" className="text-muted-foreground">
              Current {providerName} status: {formatMatchStatus(currentMatch)}
            </Text>
          ) : null}

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
              className="w-full"
              aria-label={providerName ? `Search ${providerName}` : 'Search tracks'}
              placeholder={
                providerName
                  ? `Search ${providerName}`
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

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedProvider || isSaving}
            onClick={() => {
              void onSkip()
            }}
          >
            {providerName ? `Do not export to ${providerName}` : 'Skip export'}
          </Button>
          <Button
            type="button"
            disabled={!selectedProvider || isSaving}
            onClick={onNext}
          >
            Next unresolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function formatMatchStatus(match: TrackMatch) {
  switch (match.status) {
    case 'MATCHED':
      return 'Matched automatically'
    case 'MANUALLY_MATCHED':
      return 'Matched manually'
    case 'SKIPPED':
      return 'Not included in export'
    case 'LOW_CONFIDENCE':
      return 'Needs review'
    default:
      return 'Not matched'
  }
}

function formatDuration(durationMs: number) {
  const seconds = Math.round(durationMs / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
