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
          gameHasOccured: game.gameHasOccured,
          gameDateTimeUTC: game.gameDateTimeUTC,
          ...boxScoreData,
        };
      } catch (err) {
        console.error(err, game.nbaGameId);
      }
    },
    1000
  );

  console.error("Writing to file...");
  await writeFile('./scripts/local/preseasonGames.json', JSON.stringify(gamesData));

  console.error("Finished");
}


async function main() {
  writeGamesDataToFile();
}

main();