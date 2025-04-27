/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Channel_slug_key" ON "Channel"("slug");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
