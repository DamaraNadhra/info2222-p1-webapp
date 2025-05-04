/*
  Warnings:

  - You are about to drop the column `groupKey` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ChannelKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channelId]` on the table `ChannelKey` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ChannelKey" DROP CONSTRAINT "ChannelKey_userId_fkey";

-- DropIndex
DROP INDEX "Channel_groupKey_key";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "groupKey",
ADD COLUMN     "channelKeyId" TEXT;

-- AlterTable
ALTER TABLE "ChannelKey" DROP COLUMN "userId",
ALTER COLUMN "channelId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ChannelKeyToUser" (
    "id" TEXT NOT NULL,
    "channelKeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChannelKeyToUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelKey_channelId_key" ON "ChannelKey"("channelId");

-- AddForeignKey
ALTER TABLE "ChannelKeyToUser" ADD CONSTRAINT "ChannelKeyToUser_channelKeyId_fkey" FOREIGN KEY ("channelKeyId") REFERENCES "ChannelKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelKeyToUser" ADD CONSTRAINT "ChannelKeyToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
