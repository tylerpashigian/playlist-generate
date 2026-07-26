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
      saveStatus={review.saveStatus}
      saveMessage={review.saveMessage}
      searchErrorMessage={review.searchErrorMessage}
      saveErrorMessage={review.saveErrorMessage}
      unresolvedCount={review.unresolvedCount}
      matchedCount={review.matchedCount}
      skippedCount={review.skippedCount}
      resolvedCount={review.resolvedCount}
      isReviewComplete={review.isReviewComplete}
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
      onConfirm={review.confirmCurrentMatch}
      onSkip={review.skip}
      onRetrySave={review.retrySave}
      onNext={review.nextTrack}
    />
  )
}
