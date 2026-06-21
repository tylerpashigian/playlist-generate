/*
  Warnings:

  - You are about to drop the column `accessToken` on the `streaming_connection` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `streaming_connection` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `streaming_connection` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiresAt` on the `streaming_connection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "streaming_connection" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
DROP COLUMN "scopes",
DROP COLUMN "tokenExpiresAt";
