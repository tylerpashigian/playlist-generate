// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PlaylistDetailLoading } from './playlist-detail-loading'

afterEach(() => {
  cleanup()
})

describe('PlaylistDetailLoading', () => {
  it('announces loading and renders five playlist item skeletons', () => {
    const { container } = render(<PlaylistDetailLoading />)

    expect(screen.getByRole('status').textContent).toContain(
      'Loading playlist details',
    )
    expect(container.querySelectorAll('ol > li')).toHaveLength(5)
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(20)
  })
})
