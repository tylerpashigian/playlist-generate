-- AlterEnum
ALTER TYPE "TrackMatchStatus" ADD VALUE 'MANUALLY_MATCHED';

-- AlterTable
ALTER TABLE "playlist_item" ADD COLUMN     "isIncluded" BOOLEAN NOT NULL DEFAULT true;
