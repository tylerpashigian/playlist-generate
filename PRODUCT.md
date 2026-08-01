# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Encore is primarily for concertgoers preparing for an upcoming show. They want
to understand what an artist has been playing recently, turn that likely live
set into a useful playlist, and export it to their streaming service of choice.

## Product Purpose

Encore turns recent public setlist history into a confidence-ranked playlist
that helps a concertgoer prepare for a show. Success means the user can quickly
find an artist, understand which songs are likely to appear, review the
supporting setlist evidence, and leave with a clean playlist in a connected
streaming service.

## Positioning

Encore models what an artist is playing live now. It ranks songs from recent
setlists using recency-weighted evidence rather than recommending artists or
tracks from current popularity, charts, or general listening behavior. Each
track exposes its confidence and appearance count so the result can be judged
instead of treated as a black-box recommendation.

## Operating Context

The core workflow is:

1. Search for an artist.
2. Generate a playlist from recent Setlist.fm history.
3. Review confidence, setlist appearances, covers, and likely songs.
4. Include or remove tracks and save the playlist to an account.
5. Connect a streaming service, review or correct track matches, and export.

Users may return to saved artist playlists to refresh them as new setlists
become available, adjust matches, export them, or delete them.

## Capabilities and Constraints

- Artist discovery and recent live-performance data currently come from
  Setlist.fm.
- Generation currently considers up to 10 recent valid setlists, weights newer
  shows more heavily, and returns up to 25 ranked tracks.
- Track evidence includes confidence, appearances across the considered
  setlists, cover attribution when available, and the option to exclude a
  track.
- Accounts support email and social sign-in. Email verification remains a
  product requirement where applicable.
- Saved playlists, streaming-service connections, track matching, manual match
  review, skipped tracks, and exports are account-scoped.
- Apple Music is fully supported for connection, track matching, and playlist
  export. Spotify is available in beta because Spotify limits how new apps can
  be made available. Neither provider is Encore's brand identity.
- The integration model remains provider-agnostic. Additional services may be
  added over time, and the product should present connected services as peer
  destinations rather than treating one as the default identity.
- A user currently has one saved playlist per artist; regenerating that
  artist's playlist can replace the existing draft.

## Brand Commitments

- The product name is Encore.
- Encore should speak plainly and confidently about recent live-set evidence,
  concert preparation, and user review.
- Streaming providers are functional destinations, not the Encore brand.
  Spotify-specific language and assets should appear only where the current
  integration requires them and must not define provider-neutral surfaces.

## Evidence on Hand

- The repository contains a working public landing page, playlist builder,
  account and verification flow, profile and saved-playlist management,
  Setlist.fm ingestion, confidence scoring, Spotify connection, track-match
  review, and export workflow.
- The scoring implementation and automated tests provide demonstrable product
  evidence for recency weighting, confidence scores, appearance counts, cover
  handling, and playlist limits.
- No customer testimonials, usage benchmarks, press coverage, pricing claims,
  or comparative accuracy studies are currently available. Future work must
  not fabricate them.

## Product Principles

1. Prepare people for the show they are about to attend.
2. Favor recent live evidence over popularity and generalized recommendation.
3. Make every prediction inspectable and easy to edit.
4. Keep the path from artist search to a usable exported playlist short.
5. Treat streaming services as interchangeable destinations so Encore can grow
   beyond its first provider.
