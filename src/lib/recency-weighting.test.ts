import { describe, expect, it } from 'vitest'

import { getRecencyWeights } from './recency-weighting'

describe('getRecencyWeights', () => {
  it('returns descending weights from the setlist count to one', () => {
    expect(getRecencyWeights(10)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
  })

  it('supports an empty evidence window', () => {
    expect(getRecencyWeights(0)).toEqual([])
  })

  it.each([-1, 1.5])(
    'rejects an invalid setlist count of %s',
    (setlistCount) => {
      expect(() => getRecencyWeights(setlistCount)).toThrow(RangeError)
    },
  )
})
