export function getRecencyWeights(setlistCount: number): Array<number> {
  if (!Number.isInteger(setlistCount) || setlistCount < 0) {
    throw new RangeError('Setlist count must be a non-negative integer.')
  }

  return Array.from(
    { length: setlistCount },
    (_, index) => setlistCount - index,
  )
}
