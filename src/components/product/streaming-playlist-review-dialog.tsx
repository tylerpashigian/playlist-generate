import { StreamingMatchManagerDialog } from '@/components/product/streaming-match-manager-dialog'
import type { useStreamingTrackReview } from '@/hooks/use-streaming-track-review'

type StreamingTrackReview = ReturnType<typeof useStreamingTrackReview>

export function StreamingPlaylistReviewDialog({
  review,
}: {
  review: StreamingTrackReview
}) {
  return (
    <StreamingMatchManagerDialog
      open={review.isOpen}
      track={review.track}
      trackRows={review.trackRows}
      trackCount={review.trackCount}
      selectedTrackStatus={review.selectedTrackStatus}
      providers={review.providerOptions}
      selectedProvider={review.selectedProvider}
      filter={review.filter}
      trackQuery={review.trackQuery}
      mobileView={review.mobileView}
      currentMatch={review.currentMatch}
      candidates={review.candidates}
      isSearching={review.isSearching}
      isSaving={review.isSaving}
      nextLabel={review.nextLabel}
      onOpenChange={(open) => {
        if (!open) {
          review.closeReview()
        }
      }}
      onProviderChange={review.selectProvider}
      onTrackChange={review.selectTrack}
      onFilterChange={review.setFilter}
      onTrackQueryChange={review.setTrackQuery}
      onMobileViewChange={review.setMobileView}
      onClearCandidates={review.clearCandidates}
      onSearch={review.search}
      onSelect={review.selectCandidate}
      onSkip={review.skip}
      onNext={review.nextTrack}
    />
  )
}
