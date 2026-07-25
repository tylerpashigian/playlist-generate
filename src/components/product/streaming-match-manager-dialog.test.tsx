// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StreamingMatchManagerDialog } from './streaming-match-manager-dialog'
import type { StreamingTrackCandidate } from '@/models/streaming/models'

const breakpoint = vi.hoisted<{ surface: 'dialog' | 'drawer' }>(() => ({
  surface: 'dialog',
}))

vi.mock('@/hooks/use-breakpoint-value', () => ({
  useBreakpointValue: () => breakpoint.surface,
}))

beforeEach(() => {
  breakpoint.surface = 'dialog'
})

afterEach(cleanup)

const track = {
  id: 'playlist-track-id',
  position: 23,
  title: 'Generated title',
  normalizedTitle: 'generated title',
  isIncluded: true,
  isCover: false,
  originalArtistName: null,
  originalArtistMbid: null,
  confidenceScore: 75,
  weightedScore: 75,
  appearanceCount: 5,
  totalSetlistsConsidered: 10,
  lastPlayedAt: new Date('2026-07-01T00:00:00.000Z'),
  evidence: { setlistfmIds: [], playedAt: [] },
}

const candidate = {
  provider: 'SPOTIFY' as const,
  providerTrackId: 'spotify-track-id',
  externalUrl: 'https://open.spotify.com/track/123',
  title: 'Intended recording',
  artistName: 'Recording Artist',
  albumName: 'Album Name',
  durationMs: 243000,
}

const trackRows = [
  {
    track,
    match: null,
    status: 'needs-review' as const,
  },
  {
    track: {
      ...track,
      id: 'matched-track-id',
      position: 24,
      title: 'Matched track',
    },
    match: {
      playlistTrackId: 'matched-track-id',
      provider: 'SPOTIFY' as const,
      status: 'MATCHED' as const,
      providerTrackId: 'matched-provider-track-id',
      providerTrackUri: 'spotify:track:matched',
      externalUrl: null,
      trackName: 'Matched recording',
      artistName: 'Recording Artist',
      albumName: 'Matched Album',
      durationMs: 200000,
      matchConfidenceScore: 95,
    },
    status: 'matched' as const,
  },
]

describe('StreamingMatchManagerDialog', () => {
  it('renders the two-pane provider match editor in a desktop dialog', () => {
    renderDialog()

    const desktop = within(screen.getByTestId('desktop-match-manager'))

    expect(desktop.getByLabelText('Find a playlist track')).toBeTruthy()
    expect(
      desktop.getByRole('combobox', { name: 'Streaming service' }),
    ).toBeTruthy()
    expect(
      desktop.getByPlaceholderText('Track title, artist, or album'),
    ).toBeTruthy()
    expect(desktop.getAllByText('Needs review').length).toBeGreaterThan(0)
    expect(desktop.getAllByText('Matched').length).toBeGreaterThan(0)
  })

  it('switches to Match when a track is selected from the browser', () => {
    breakpoint.surface = 'drawer'
    const onTrackChange = vi.fn()
    renderDialog({ mobileView: 'tracks', onTrackChange })

    const mobile = within(screen.getByTestId('mobile-match-manager'))

    expect(
      mobile.getByRole('tab', { name: 'Tracks · 1 remaining' }),
    ).toBeTruthy()
    expect(mobile.getByRole('tab', { name: 'Match' })).toBeTruthy()

    fireEvent.click(mobile.getByRole('button', { name: /Generated title/ }))

    expect(onTrackChange).toHaveBeenCalledWith('playlist-track-id')
  })

  it('keeps provider selection enabled for the shared manager', () => {
    renderDialog()

    expect(
      within(
        screen.getByTestId('desktop-match-manager'),
      ).getByRole<HTMLButtonElement>('combobox', {
        name: 'Streaming service',
      }).disabled,
    ).toBe(false)
  })

  it('offers confirmation for a proposed low-confidence match', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    renderDialog({
      currentMatch: {
        playlistTrackId: track.id,
        provider: 'SPOTIFY',
        status: 'LOW_CONFIDENCE',
        providerTrackId: candidate.providerTrackId,
        providerTrackUri: 'spotify:track:123',
        externalUrl: candidate.externalUrl,
        trackName: candidate.title,
        artistName: candidate.artistName,
        albumName: candidate.albumName,
        durationMs: candidate.durationMs,
        matchConfidenceScore: 62,
      },
      onConfirm,
    })

    expect(screen.getByText('Proposed Spotify match')).toBeTruthy()
    expect(
      screen.getByPlaceholderText('Track title, artist, or album'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm match' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders contextual provider copy and detailed custom results', () => {
    renderDialog()

    const manager = within(screen.getByTestId('desktop-match-manager'))

    expect(
      manager.getByRole('button', { name: 'Skip on Spotify' }),
    ).toBeTruthy()

    const searchInput = manager.getByPlaceholderText(
      'Track title, artist, or album',
    )
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

    expect(screen.getByText('Intended recording')).toBeTruthy()
    expect(screen.getByText('Recording Artist · Album Name')).toBeTruthy()
    expect(screen.getByText('4:03')).toBeTruthy()
  })

  it('selects the highlighted candidate with the keyboard', () => {
    const onSelect = vi.fn().mockResolvedValue(undefined)
    renderDialog({ onSelect })

    const searchInput = within(
      screen.getByTestId('desktop-match-manager'),
    ).getByPlaceholderText('Track title, artist, or album')
    fireEvent.change(searchInput, { target: { value: 'intended' } })
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith(candidate)
  })

  it('requires a provider before enabling candidate search', () => {
    renderDialog({ selectedProvider: null })

    expect(
      within(
        screen.getByTestId('desktop-match-manager'),
      ).getByPlaceholderText<HTMLInputElement>(
        'Select a streaming service first',
      ).disabled,
    ).toBe(true)
  })

  it('clears candidates when the candidate query becomes too short', () => {
    const onClearCandidates = vi.fn()
    renderDialog({ onClearCandidates })

    fireEvent.change(
      within(screen.getByTestId('desktop-match-manager')).getByPlaceholderText(
        'Track title, artist, or album',
      ),
      {
        target: { value: 'a' },
      },
    )

    expect(onClearCandidates).toHaveBeenCalledOnce()
  })

  it('shows compact setlist evidence without implying concert-by-concert data', () => {
    renderDialog({
      currentMatch: trackRows[1].match,
      selectedTrackStatus: 'matched',
    })

    const manager = within(screen.getByTestId('desktop-match-manager'))

    expect(manager.getByText('Recent appearances')).toBeTruthy()
    expect(manager.getByText('5 of 10')).toBeTruthy()
    expect(manager.getByText('Setlist confidence')).toBeTruthy()
    expect(manager.getByText('75%')).toBeTruthy()
    expect(manager.getByText('Most recent')).toBeTruthy()
    expect(manager.getByText('Jul 1, 2026')).toBeTruthy()
    expect(manager.getByText('Automatic match confidence')).toBeTruthy()
    expect(manager.getByText('95%')).toBeTruthy()
    expect(
      manager.getByPlaceholderText('Track title, artist, or album'),
    ).toBeTruthy()
  })

  it('renders a labelled mobile close action with the unresolved count', () => {
    breakpoint.surface = 'drawer'
    const onOpenChange = vi.fn()
    renderDialog({ mobileView: 'tracks', onOpenChange })

    expect(
      screen.getByRole('button', { name: 'Close match manager' }),
    ).toBeTruthy()
    expect(screen.getByText('1 remaining')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close match manager' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('places provider search before secondary evidence on mobile', () => {
    breakpoint.surface = 'drawer'
    renderDialog({ mobileView: 'match' })

    const mobile = within(screen.getByTestId('mobile-match-manager'))
    const searchInput = mobile.getByPlaceholderText(
      'Track title, artist, or album',
    )
    const evidenceLabel = mobile.getByText('Recent appearances')

    expect(
      searchInput.compareDocumentPosition(evidenceLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('returns to export when every track has a provider decision', () => {
    const onOpenChange = vi.fn()
    renderDialog({
      isReviewComplete: true,
      unresolvedCount: 0,
      resolvedCount: 2,
      matchedCount: 1,
      skippedCount: 1,
      onOpenChange,
    })

    expect(screen.getByText('Review complete')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Done — return to export' }),
    )

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps contextual save recovery beside the action area', () => {
    const onRetrySave = vi.fn().mockResolvedValue(undefined)
    renderDialog({
      saveStatus: 'error',
      saveMessage: 'Spotify could not save this decision.',
      saveErrorMessage: 'Spotify could not save this decision.',
      onRetrySave,
    })

    expect(
      screen.getByText('Spotify could not save this decision.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }))

    expect(onRetrySave).toHaveBeenCalledOnce()
  })
})

function renderDialog({
  onSelect = vi.fn().mockResolvedValue(undefined),
  onConfirm = vi.fn().mockResolvedValue(undefined),
  onClearCandidates = vi.fn(),
  onTrackChange = vi.fn(),
  onOpenChange = vi.fn(),
  onRetrySave = vi.fn().mockResolvedValue(undefined),
  selectedProvider = 'SPOTIFY',
  selectedTrackStatus = 'needs-review',
  mobileView = 'match',
  currentMatch = null,
  saveStatus = 'idle',
  saveMessage = null,
  searchErrorMessage = null,
  saveErrorMessage = null,
  unresolvedCount = 1,
  matchedCount = 1,
  skippedCount = 0,
  resolvedCount = 1,
  isReviewComplete = false,
}: {
  onSelect?: (selectedCandidate: StreamingTrackCandidate) => Promise<void>
  onConfirm?: () => Promise<void>
  onClearCandidates?: () => void
  onTrackChange?: (trackId: string) => void
  onOpenChange?: (open: boolean) => void
  onRetrySave?: () => Promise<void>
  selectedProvider?: 'SPOTIFY' | null
  selectedTrackStatus?: 'needs-review' | 'matched' | 'skipped'
  mobileView?: 'tracks' | 'match'
  currentMatch?: (typeof trackRows)[number]['match']
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  saveMessage?: string | null
  searchErrorMessage?: string | null
  saveErrorMessage?: string | null
  unresolvedCount?: number
  matchedCount?: number
  skippedCount?: number
  resolvedCount?: number
  isReviewComplete?: boolean
} = {}) {
  return render(
    <StreamingMatchManagerDialog
      open
      track={track}
      trackRows={trackRows}
      trackCount={trackRows.length}
      selectedTrackStatus={selectedTrackStatus}
      providers={[{ provider: 'SPOTIFY', label: 'Spotify' }]}
      selectedProvider={selectedProvider}
      filter="all"
      trackQuery=""
      mobileView={mobileView}
      currentMatch={currentMatch}
      candidates={[candidate]}
      isSearching={false}
      isSaving={false}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      searchErrorMessage={searchErrorMessage}
      saveErrorMessage={saveErrorMessage}
      unresolvedCount={unresolvedCount}
      matchedCount={matchedCount}
      skippedCount={skippedCount}
      resolvedCount={resolvedCount}
      isReviewComplete={isReviewComplete}
      nextLabel="Review later"
      onOpenChange={onOpenChange}
      onProviderChange={vi.fn()}
      onTrackChange={onTrackChange}
      onFilterChange={vi.fn()}
      onTrackQueryChange={vi.fn()}
      onMobileViewChange={vi.fn()}
      onClearCandidates={onClearCandidates}
      onSearch={vi.fn().mockResolvedValue(undefined)}
      onSelect={onSelect}
      onConfirm={onConfirm}
      onSkip={vi.fn().mockResolvedValue(undefined)}
      onRetrySave={onRetrySave}
      onNext={vi.fn()}
    />,
  )
}
