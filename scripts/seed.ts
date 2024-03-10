import { writeFile, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { Player } from "./jsonTypes";

import { getBoxScoreData, getGamesSchedule } from "./data";
import { withDelay } from "./utility";
import { ExtractedGame } from "./jsonTypes";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Checks if the extracted games are valid.
 * @param games - An array of extracted games.
 * @returns A boolean indicating whether all extracted games have valid home team data.
 */
function isExtractedGamesValid(games: ExtractedGame[]) {
  return games.every((game) => game.homeTeamData);
}

/**
 * Retrieves the game data along with the box score data for a given NBA game.
 *
 * @param game - The game object containing the necessary information.
 * @returns The extracted game object with the box score data.
 */
async function getGameWithBoxScore(game: {
  nbaGameId: string;
  isPreseasonGame: boolean;
  gameHasFinished: boolean;
  gameDateTimeUTC: string;
}) {
  try {
    console.error(`Getting box score data for game ${game.nbaGameId}`);
    const boxScoreData = await getBoxScoreData(game.nbaGameId);
    const extractedGame: ExtractedGame = {
      nbaGameId: game.nbaGameId,
      isPreseasonGame: game.isPreseasonGame,
      gameHasFinished: game.gameHasFinished,
      gameDateTimeUTC: game.gameDateTimeUTC,
      ...boxScoreData,
    };
    return extractedGame;
  } catch (err) {
    console.error(err, game.nbaGameId);
    return {
      nbaGameId: game.nbaGameId,
      isPreseasonGame: game.isPreseasonGame,
      gameHasFinished: game.gameHasFinished,
      gameDateTimeUTC: game.gameDateTimeUTC,
    };
  }
}

/**
 * Asynchronously fetches missing game data, updates a storage file, and indicates if the written data is valid.
 *
 * @param fileName - The name of the file used to store game data.
 * @returns A Promise resolving to a boolean:
 *   - `true` if the stored game data is valid (all games have home team data).
 *   - `false` if any stored game is missing home team data.
 */
async function writeMissingGamesDataToFile(fileName: string): Promise<boolean> {
  console.error("Getting scheduled games...");
  const scheduledGames = await getGamesSchedule();
  const finishedGames = scheduledGames.filter((game) => game.gameHasFinished);

  const storedGamesFile = await readFile(fileName, "utf-8");
  let storedGames: ExtractedGame[] | null;
  try {
    storedGames = JSON.parse(storedGamesFile);
  } catch (e) {
    storedGames = null;
  }

  let gamesNotStored;
  // if no games have been stored yet
  if (storedGames == null) {
    gamesNotStored = finishedGames;
    storedGames = [];
  } else {
    const newestStoredGameDate = new Date(
      storedGames[storedGames.length - 1].gameDateTimeUTC
    );

    gamesNotStored = finishedGames.filter(
      (game) => new Date(game.gameDateTimeUTC) > newestStoredGameDate
    );
  }

  console.error(`Getting box score data for ${gamesNotStored.length} games...`);

  const gamesToStore = await withDelay(
    gamesNotStored,
    async (game) => getGameWithBoxScore(game),
    250
  );

  let updatedGames: (
    | ExtractedGame
    | {
        nbaGameId: string;
        isPreseasonGame: boolean;
        gameHasFinished: boolean;
        gameDateTimeUTC: string;
      }
  )[] = [];

  storedGames.forEach((game) => updatedGames.push(game));
  updatedGames = updatedGames.concat(gamesToStore);

  await writeFile(fileName, JSON.stringify(updatedGames));
  console.error("Writing to file...");
  return isExtractedGamesValid(updatedGames as ExtractedGame[]);
}

/**
 * Fills missing games data by retrieving box score data for each game
 * and updating the gamesDataJSON array.
 *
 * @param fileName - The name of the file containing the games data.
 * @returns A Promise that resolves when the missing games data has been filled.
 */
async function fillMissingGamesData(fileName: string) {
  console.error(`Getting games from ${fileName}...`);
  const gamesText = await readFile(fileName, "utf-8");
  const gamesData: ExtractedGame[] = JSON.parse(gamesText);

  for (let id = 0; id < gamesData.length; id++) {
    const game = gamesData[id];

    if (game.homeTeamData) continue;

    try {
      console.error(`Getting box score data for game ${game.nbaGameId}`);
      const boxScoreData = await getBoxScoreData(game.nbaGameId);
      gamesData[id] = {
        ...game,
        ...boxScoreData,
      };
    } catch (err) {
      console.error(err, game.nbaGameId);
    }
  }

  console.error("Writing to file...");
  await writeFile(fileName, JSON.stringify(gamesData));
  console.error("Finished");

  return isExtractedGamesValid(gamesData);
}

/**
 * Updates the database from a game.
 *
 * @param game - The extracted game object.
 * @returns A Promise that resolves to the query result.
 */
async function updateDBFromGame(game: ExtractedGame) {
  console.error("======================================================");

  console.error(`Updating DB from game ${game.nbaGameId}...`);
  await updateTeamTable(game);
  console.error("finished updating team table");

  console.error("updating player table");
  await updatePlayerTable(game);
  console.error("finished updating player table");

  console.error("inserting game data");
  const query = await insertGameData(game);
  console.error("finished inserting game data");

  console.error("======================================================");
  return query;
}

/**
 * Updates the player table with the new NBA team ID for each player in the game.
 *
 * @param game - The extracted game data.
 * @returns A promise that resolves when the player table is updated.
 */
async function updatePlayerTable(game: ExtractedGame) {
  await Promise.all(
    game.homeTeamData.players.map(async (player) =>
      updatePlayerData(player, game.homeTeamData.nbaTeamId)
    )
  );
  await Promise.all(
    game.awayTeamData.players.map(async (player) =>
      updatePlayerData(player, game.awayTeamData.nbaTeamId)
    )
  );
}

/**
 * Updates the team table with the data from the provided game.
 * @param game - The extracted game data.
 */
async function updateTeamTable(game: ExtractedGame) {
  async function doesTeamExist(nbaTeamId: string) {
    const team = await prisma.team.findUnique({
      where: {
        nbaTeamId: nbaTeamId,
      },
    });

    return team !== null;
  }

  const homeTeamNbaId = game.homeTeamData.nbaTeamId;
  const awayTeamNbaId = game.awayTeamData.nbaTeamId;

  if (!(await doesTeamExist(homeTeamNbaId))) {
    await prisma.team.create({
      data: {
        nbaTeamId: homeTeamNbaId,
        teamName: game.homeTeamData.teamName,
        teamCity: game.homeTeamData.teamCity,
      },
    });
  }

  if (!(await doesTeamExist(awayTeamNbaId))) {
    await prisma.team.create({
      data: {
        nbaTeamId: awayTeamNbaId,
        teamName: game.awayTeamData.teamName,
        teamCity: game.awayTeamData.teamCity,
      },
    });
  }
  console.error("finished updating team table");
}

/**
 * Updates the player data with a new NBA team ID.
 * If the player does not exist, it creates a new player with the specified NBA team ID.
 * If the player's team has changed, it updates the player's team with the new NBA team ID.
 * @param player - The player object containing the player's details.
 * @param newNbaTeamId - The new NBA team ID to update the player's team.
 * @returns Promise<void>
 */
async function updatePlayerData(player: Player, newNbaTeamId: string) {
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

/**
 * Inserts game data into the database.
 * @param game - The extracted game data to be inserted.
 * @returns A Promise that resolves to the inserted game data.
 */
async function insertGameData(game: ExtractedGame) {
  const query = await prisma.game.create({
    data: {
      gameDateTimeUTC: game.gameDateTimeUTC,
      isPreseasonGame: game.isPreseasonGame,
      nbaGameId: game.nbaGameId,
      awayTeam: {
        connect: {
          nbaTeamId: game.awayTeamData.nbaTeamId,
        },
      },
      homeTeam: {
        connect: {
          nbaTeamId: game.homeTeamData.nbaTeamId,
        },
      },
      playerStats: {
        createMany: {
          data: await Promise.all(
            game.awayTeamData.players
              .concat(game.homeTeamData.players)
              .map(async (player) => {
                const playerId = (await prisma.player.findUnique({
                  where: {
                    nbaPersonId: player.personId,
                  },
                  select: {
                    id: true,
                  },
                }))!.id;
                const stats = player.statistics;

                return {
                  playerId: playerId,
                  minutes: stats.minutes,
                  fieldGoalsMade: stats.fieldGoalsMade,
                  fieldGoalsAttempted: stats.fieldGoalsAttempted,
                  threePointersMade: stats.threePointersMade,
                  threePointersAttempted: stats.threePointersAttempted,
                  freeThrowsMade: stats.freeThrowsMade,
                  freeThrowsAttempted: stats.freeThrowsAttempted,
                  reboundsOffensive: stats.reboundsOffensive,
                  reboundsDefensive: stats.reboundsDefensive,
                  assists: stats.assists,
                  steals: stats.steals,
                  blocks: stats.blocks,
                  turnovers: stats.turnovers,
                  foulsPersonal: stats.foulsPersonal,
                  points: stats.points,
                  plusMinusPoints: stats.plusMinusPoints,
                };
              })
          ),
        },
      },
    },
  });

  return query;
}

/**
 * Writes missing games data to the database.
 *
 * @param fileName - The name of the file containing the games data.
 * @returns A Promise that resolves when the missing games data is written to the database.
 */
async function writeMissingGamesDataToDB(fileName: string) {
  const gamesData = await readFile(fileName, "utf-8");
  console.error("reading file");

  const gamesInFile: ExtractedGame[] = JSON.parse(gamesData) as ExtractedGame[];

  console.error(`got ${gamesInFile.length} games from file`);

  const newestGameInDB = await prisma.game.findFirst({
    orderBy: {
      gameDateTimeUTC: "desc",
    },
    select: {
      gameDateTimeUTC: true,
    },
  });

  let gamesMissingFromDB;
  if (newestGameInDB == null) {
    gamesMissingFromDB = gamesInFile;
  } else {
    const newestGameInDBDate = new Date(newestGameInDB.gameDateTimeUTC);

    console.error("getting games that are missing from db");
    gamesMissingFromDB = gamesInFile.filter(
      (game) => new Date(game.gameDateTimeUTC) > newestGameInDBDate
    );
  }

  console.error("writing to db");
  for (const game of gamesMissingFromDB) {
    await updateDBFromGame(game);
  }
}

async function extractMissingGamesData(fileName: string) {
  console.error("Saving games locally...");
  const isAllDataFilled = await writeMissingGamesDataToFile(fileName);

  let isDataFixed = false;
  if (!isAllDataFilled) {
    isDataFixed = await fillMissingGamesData(fileName);
  }

  if (!isDataFixed) {
    throw new Error("Data could not be fixed");
  }

  console.error("Inserting data into DB...");
  await writeMissingGamesDataToDB(fileName);
}

async function main() {
  const prisma = new PrismaClient();

  extractMissingGamesData("./gamesSoFar.json");
}

main()
  .then(async (e) => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
