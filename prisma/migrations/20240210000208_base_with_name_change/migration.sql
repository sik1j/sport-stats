/*
  Warnings:

  - You are about to drop the column `gameTimeUTC` on the `Game` table. All the data in the column will be lost.
  - Added the required column `gameDateTimeUTC` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "gameTimeUTC",
ADD COLUMN     "gameDateTimeUTC" TIMESTAMP(3) NOT NULL;
