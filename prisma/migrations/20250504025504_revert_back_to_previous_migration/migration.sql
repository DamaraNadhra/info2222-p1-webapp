/*
  Warnings:

  - You are about to drop the `ChannelKeyToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `ChannelKey` table without a default value. This is not possible if the table is not empty.
  - Made the column `channelId` on table `ChannelKey` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChannelKeyToUser" DROP CONSTRAINT "ChannelKeyToUser_channelKeyId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelKeyToUser" DROP CONSTRAINT "ChannelKeyToUser_userId_fkey";

-- AlterTable
ALTER TABLE "ChannelKey" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "channelId" SET NOT NULL;

-- DropTable
DROP TABLE "ChannelKeyToUser";

-- AddForeignKey
ALTER TABLE "ChannelKey" ADD CONSTRAINT "ChannelKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
