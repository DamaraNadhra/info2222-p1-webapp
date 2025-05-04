/*
  Warnings:

  - A unique constraint covering the columns `[groupKey]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "groupKey" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "publicKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "publicKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Channel_groupKey_key" ON "Channel"("groupKey");
