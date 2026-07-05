export const calculateScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)'
  if (score >= 75) return 'var(--warning)'
  if (score >= 50) return 'var(--review)'
  return 'var(--destructive)'
}