// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ExportActionsPanel,
  getExportReadinessMetrics,
} from './export-actions-panel'
import type { TrackMatch } from '@/models/spotify/models'

describe('getExportReadinessMetrics', () => {
  it('returns empty metrics when there are no matches', () => {
    expect(getExportReadinessMetrics([])).toEqual({
      matchedCount: 0,
      reviewCount: 0,
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
      reviewCount: 3,
    })
  })
})

describe('ExportActionsPanel', () => {
  it('does not show export readiness metrics before tracks are matched', () => {
    render(
      <ExportActionsPanel
        groups={[
          {
            provider: 'SPOTIFY',
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
        groups={[
          {
            provider: 'SPOTIFY',
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
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })
})
