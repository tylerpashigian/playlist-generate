/*
  Warnings:

  - A unique constraint covering the columns `[userId,artistId]` on the table `playlist` will be added. If there are existing duplicate values, this will fail.

*/
-- Keep the newest playlist for each user and artist before enforcing uniqueness.
-- Deleting playlists cascades to playlist items, track matches, and external
-- playlist metadata through the existing foreign-key constraints.
WITH ranked_playlists AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", "artistId"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS row_number
    FROM "playlist"
)
DELETE FROM "playlist"
USING ranked_playlists
WHERE "playlist"."id" = ranked_playlists."id"
  AND ranked_playlists.row_number > 1;

-- CreateIndex
CREATE UNIQUE INDEX "playlist_userId_artistId_key" ON "playlist"("userId", "artistId");
