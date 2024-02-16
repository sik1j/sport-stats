import { writeFile, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { Player } from "./jsonTypes";

import { getBoxScoreData, getGamesSchedule } from "./data";
import { withDelay } from "./utility";
import { ExtractedGame } from "./jsonTypes";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function writeGamesDataToFile() {
  console.error("Getting preseason games...");
  const games = await getGamesSchedule();
  const preseasonGames = games.filter((game) => game.isPreseasonGame);

  console.error("Getting box score data...");
  const gamesData = await withDelay(
    preseasonGames,
    async (game) => {
      try {
        console.error(`Getting box score data for game ${game.nbaGameId}`);
        const boxScoreData = await getBoxScoreData(game.nbaGameId);
        return {
          nbaGameId: game.nbaGameId,
          isPreseasonGame: game.isPreseasonGame,
          gameHasFinished: game.gameHasFinished,
          gameDateTimeUTC: game.gameDateTimeUTC,
          ...boxScoreData,
        };
      } catch (err) {
        console.error(err, game.nbaGameId);
        return {
          nbaGameId: game.nbaGameId,
          isPreseasonGame: game.isPreseasonGame,
          gameHasFinished: game.gameHasFinished,
          gameDateTimeUTC: game.gameDateTimeUTC,
        };
      }
    },
    250
  );

  console.error("Writing to file...");
  await writeFile(
    "./scripts/local/preseasonGames.json",
    JSON.stringify(gamesData)
  );

  console.error("Finished");
}


  console.error("Finished");
}

async function updatePlayerData({
  player,
  newNbaTeamId,
}: {
  player: Player;
  newNbaTeamId: string;
}) {
  const playerData = await prisma.player.findUnique({
    where: {
      nbaPersonId: player.personId,
    },
    select: {
      team: true,
    },
  });

  // Create player if not exists
  if (playerData == null) {
    await prisma.player.create({
      data: {
        firstName: player.firstName,
        familyName: player.familyName,
        nbaPersonId: player.personId,
        team: {
          connect: {
            nbaTeamId: newNbaTeamId,
          },
        },
      },
    });
    return;
  }

  if (playerData.team.nbaTeamId == newNbaTeamId) return;

  // Update player if team changed
  await prisma.player.update({
    where: {
      nbaPersonId: player.personId,
    },
    data: {
      team: {
        connect: {
          nbaTeamId: newNbaTeamId,
        },
      },
    },
  });
  console.error("finished updating player table");
}

async function main() {
  writeGamesDataToFile();
}

main();