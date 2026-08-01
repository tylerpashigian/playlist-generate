-- AlterEnum
ALTER TYPE "StreamingProvider" ADD VALUE 'APPLE_MUSIC';

-- AlterTable
ALTER TABLE "streaming_connection" ALTER COLUMN "providerAccountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "apple_music_credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionKeyHash" TEXT NOT NULL,
    "musicUserToken" TEXT NOT NULL,
    "encryptionIv" TEXT NOT NULL,
    "encryptionAuthTag" TEXT NOT NULL,
    "encryptionKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "storefrontId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apple_music_credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apple_music_credential_connectionKeyHash_key" ON "apple_music_credential"("connectionKeyHash");

-- CreateIndex
CREATE INDEX "apple_music_credential_userId_idx" ON "apple_music_credential"("userId");

-- AddForeignKey
ALTER TABLE "apple_music_credential" ADD CONSTRAINT "apple_music_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
