/*
  Warnings:

  - A unique constraint covering the columns `[nbaGameId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nbaPersonId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nbaTeamId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamName]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `nbaPersonId` on the `Player` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "nbaPersonId",
ADD COLUMN     "nbaPersonId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_nbaGameId_key" ON "Game"("nbaGameId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_nbaPersonId_key" ON "Player"("nbaPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_nbaTeamId_key" ON "Team"("nbaTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamName_key" ON "Team"("teamName");
