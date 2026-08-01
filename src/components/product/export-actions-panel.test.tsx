// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ExportActionsPanel,
  getExportReadinessMetrics,
} from './export-actions-panel'
import type { TrackMatch } from '@/models/streaming/models'
import type { SavedPlaylist } from '@/models/playlists/models'

afterEach(() => {
  cleanup()
})

const savedPlaylist: SavedPlaylist = {
  id: 'playlist-id',
  artist: {
    mbid: 'artist-mbid',
    name: 'Artist',
    sortName: null,
    disambiguation: null,
    setlistfmUrl: null,
  },
  status: 'DRAFT',
  name: 'Artist recent setlist',
  description: null,
  scoringVersion: 'weighted-recency-v1',
  recentSetlistCount: 10,
  generatedAt: new Date('2026-07-01T00:00:00.000Z'),
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  trackCount: 1,
  tracks: [
    {
      id: 'track-id',
      position: 1,
      title: 'Track',
      normalizedTitle: 'track',
      isIncluded: true,
      isCover: false,
      originalArtistName: null,
      originalArtistMbid: null,
      confidenceScore: 100,
      weightedScore: 10,
      appearanceCount: 10,
      totalSetlistsConsidered: 10,
      lastPlayedAt: null,
      evidence: { setlistfmIds: [], playedAt: [] },
    },
  ],
}

const matchedTrack: TrackMatch = {
  playlistTrackId: 'track-id',
  provider: 'SPOTIFY',
  status: 'MATCHED',
  providerTrackId: 'spotify-track-id',
  providerTrackUri: 'spotify:track:track-id',
  externalUrl: null,
  trackName: 'Track',
  artistName: 'Artist',
  albumName: 'Album',
  durationMs: 180000,
  matchConfidenceScore: 100,
}

describe('getExportReadinessMetrics', () => {
  it('returns empty metrics when there are no matches', () => {
    expect(getExportReadinessMetrics([])).toEqual({
      matchedCount: 0,
      reviewCount: 0,
      skippedCount: 0,
      excludedCount: 0,
    })
  })

  it('counts matched tracks separately from tracks needing review', () => {
    expect(
      getExportReadinessMetrics([
        { status: 'MATCHED' },
        { status: 'LOW_CONFIDENCE' },
        { status: 'UNRESOLVED' },
        { status: 'SKIPPED' },
      ]),
    ).toEqual({
      matchedCount: 1,
      reviewCount: 2,
      skippedCount: 1,
      excludedCount: 0,
    })
  })
})

describe('ExportActionsPanel', () => {
  it('does not show export readiness metrics before tracks are matched', () => {
    render(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: null,
            matches: [],
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
        ]}
      />,
    )

    expect(screen.getByText('Streaming exports')).toBeTruthy()
    expect(screen.getByText('Spotify')).toBeTruthy()
    expect(screen.queryByText('Matched')).toBeNull()
    expect(screen.queryByText('Needs review')).toBeNull()
  })

  it('shows provider-specific matched and review counts after tracks are matched', () => {
    render(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: null,
            matches: [
              { status: 'MATCHED' },
              { status: 'LOW_CONFIDENCE' },
              { status: 'UNRESOLVED' },
              { status: 'SKIPPED' },
            ] as Array<TrackMatch>,
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
        ]}
      />,
    )

    expect(screen.getByText('Spotify')).toBeTruthy()
    expect(screen.getByText('Matched')).toBeTruthy()
    expect(screen.getByText('Needs review')).toBeTruthy()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Skipped')).toBeTruthy()
  })

  it('does not allow matching and export to run together', () => {
    const { rerender } = render(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: savedPlaylist,
            matches: [matchedTrack],
            exportResult: null,
            isMatching: true,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
        ]}
      />,
    )

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Export' })
        .disabled,
    ).toBe(true)

    rerender(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: savedPlaylist,
            matches: [matchedTrack],
            exportResult: null,
            isMatching: false,
            isExporting: true,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
        ]}
      />,
    )

    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: 'Auto-match tracks',
      }).disabled,
    ).toBe(true)
  })

  it('prompts for a connection instead of rendering export controls', () => {
    render(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: false,
            selectedPlaylist: savedPlaylist,
            matches: [matchedTrack],
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
            onManageMatches: vi.fn(),
          },
        ]}
      />,
    )

    expect(screen.getByText('Connect Spotify to export')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Manage connections' }),
    ).toHaveProperty('href', expect.stringContaining('/profile'))
    expect(
      screen.queryByRole('button', { name: 'Auto-match tracks' }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: 'Manage matches' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Export' })).toBeNull()
  })

  it('opens the consolidated provider match manager', () => {
    const onManageMatches = vi.fn()

    render(
      <ExportActionsPanel
        selectedProvider="SPOTIFY"
        onProviderChange={vi.fn()}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: savedPlaylist,
            matches: [],
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
            onManageMatches,
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Manage matches' }))

    expect(onManageMatches).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Review tracks' })).toBeNull()
  })

  it('shows only the selected provider actions and metrics', () => {
    const onProviderChange = vi.fn()

    render(
      <ExportActionsPanel
        selectedProvider="APPLE_MUSIC"
        onProviderChange={onProviderChange}
        groups={[
          {
            provider: 'SPOTIFY',
            isConnected: true,
            selectedPlaylist: savedPlaylist,
            matches: [matchedTrack],
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: 'Spotify-only error',
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
          {
            provider: 'APPLE_MUSIC',
            isConnected: true,
            selectedPlaylist: null,
            matches: [
              { ...matchedTrack, provider: 'APPLE_MUSIC' },
              {
                ...matchedTrack,
                provider: 'APPLE_MUSIC',
                playlistTrackId: 'review-track',
                status: 'LOW_CONFIDENCE',
              },
            ],
            exportResult: null,
            isMatching: false,
            isExporting: false,
            errorMessage: null,
            onMatchTracks: vi.fn(),
            onExport: vi.fn(),
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('combobox', { name: 'Streaming service' }).textContent,
    ).toContain('Apple Music')
    expect(screen.queryByText('Spotify-only error')).toBeNull()
    expect(screen.getByText('Needs review')).toBeTruthy()
    expect(screen.getAllByText('1')).toHaveLength(2)
  })
})
