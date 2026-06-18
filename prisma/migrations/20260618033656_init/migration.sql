-- CreateEnum
CREATE TYPE "StreamingProvider" AS ENUM ('SPOTIFY');

-- CreateEnum
CREATE TYPE "TrackMatchStatus" AS ENUM ('MATCHED', 'LOW_CONFIDENCE', 'UNRESOLVED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PlaylistStatus" AS ENUM ('DRAFT', 'EXPORTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Todo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaming_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "StreamingProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT,
    "disambiguation" TEXT,
    "setlistfmUrl" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "status" "PlaylistStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "generationSettings" JSONB,
    "scoringVersion" TEXT,
    "recentSetlistCount" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_item" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "songTitle" TEXT NOT NULL,
    "normalizedSongTitle" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "originalArtistName" TEXT,
    "originalArtistMbid" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "weightedScore" DOUBLE PRECISION NOT NULL,
    "appearanceCount" INTEGER NOT NULL,
    "totalSetlistsConsidered" INTEGER NOT NULL,
    "lastPlayedAt" TIMESTAMP(3),
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_match" (
    "id" TEXT NOT NULL,
    "playlistItemId" TEXT NOT NULL,
    "provider" "StreamingProvider" NOT NULL,
    "status" "TrackMatchStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "providerTrackId" TEXT,
    "providerTrackUri" TEXT,
    "providerTrackUrl" TEXT,
    "trackName" TEXT,
    "artistName" TEXT,
    "albumName" TEXT,
    "durationMs" INTEGER,
    "matchConfidenceScore" DOUBLE PRECISION,
    "rawPayload" JSONB,
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_playlist" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "provider" "StreamingProvider" NOT NULL,
    "providerPlaylistId" TEXT NOT NULL,
    "url" TEXT,
    "snapshotId" TEXT,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_playlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "streaming_connection_provider_providerAccountId_idx" ON "streaming_connection"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "streaming_connection_userId_provider_key" ON "streaming_connection"("userId", "provider");

-- CreateIndex
CREATE INDEX "artist_name_idx" ON "artist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "artist_mbid_key" ON "artist"("mbid");

-- CreateIndex
CREATE INDEX "playlist_userId_createdAt_idx" ON "playlist"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "playlist_artistId_idx" ON "playlist"("artistId");

-- CreateIndex
CREATE INDEX "playlist_item_playlistId_normalizedSongTitle_idx" ON "playlist_item"("playlistId", "normalizedSongTitle");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_item_playlistId_position_key" ON "playlist_item"("playlistId", "position");

-- CreateIndex
CREATE INDEX "track_match_provider_providerTrackId_idx" ON "track_match"("provider", "providerTrackId");

-- CreateIndex
CREATE UNIQUE INDEX "track_match_playlistItemId_provider_key" ON "track_match"("playlistItemId", "provider");

-- CreateIndex
CREATE INDEX "external_playlist_provider_providerPlaylistId_idx" ON "external_playlist"("provider", "providerPlaylistId");

-- CreateIndex
CREATE UNIQUE INDEX "external_playlist_playlistId_provider_key" ON "external_playlist"("playlistId", "provider");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaming_connection" ADD CONSTRAINT "streaming_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_item" ADD CONSTRAINT "playlist_item_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_match" ADD CONSTRAINT "track_match_playlistItemId_fkey" FOREIGN KEY ("playlistItemId") REFERENCES "playlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_playlist" ADD CONSTRAINT "external_playlist_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
