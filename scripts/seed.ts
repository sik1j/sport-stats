import { writeFile, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { Player } from "./jsonTypes";

import { getBoxScoreData, getGamesSchedule } from "./data";
import { withDelay } from "./utility";
import { ExtractedGame } from "./jsonTypes";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getGameData(game: {
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

async function writeGamesDataToFile(fileName: string) {
  console.error("Getting preseason games...");
  const games = await getGamesSchedule();
  const preseasonGames = games.filter((game) => game.isPreseasonGame);

  console.error("Getting box score data...");
  const gamesData = await withDelay(
    preseasonGames,
    async (game) => getGameData(game),
    250
  );

  console.error("Writing to file...");
  await writeFile(fileName, JSON.stringify(gamesData));

  console.error("Finished");
}

async function writeMissingGamesDataToFile(fileName: string) {
  console.error("Getting games...");
  const games = await getGamesSchedule();
  const finishedGames = games.filter((game) => game.gameHasFinished);

  const currentGamesData = await readFile(fileName, "utf-8");
  const currentGamesJson: ExtractedGame[] = JSON.parse(currentGamesData);
  // console.error(currentGamesJSON[currentGamesData.length - 1]);
  // console.error( currentGamesJSON[currentGamesData.length - 1]);
  const newestStoredGame = new Date(
    currentGamesJson[currentGamesJson.length - 1].gameDateTimeUTC
  );

  const gamesMissing = finishedGames.filter(
    (game) => new Date(game.gameDateTimeUTC) > newestStoredGame
  );

  console.error(gamesMissing.slice(-5));
  // console.error(gamesMissing[gamesMissing.length - 1])
  // console.error(gamesMissing.length, "games missing")

  const missingGamesJson = await withDelay(
    gamesMissing,
    async (game) => getGameData(game),
    250
  );

  let latestGamesJSON: (
    | ExtractedGame
    | {
        nbaGameId: string;
        isPreseasonGame: boolean;
        gameHasFinished: boolean;
        gameDateTimeUTC: string;
      }
  )[] = [];

  currentGamesJson.forEach((game) => latestGamesJSON.push(game));
  latestGamesJSON = latestGamesJSON.concat(missingGamesJson);

  await writeFile(fileName, JSON.stringify(latestGamesJSON));
  console.error("Writing to file...");
}

async function fillMissingGamesData(fileName: string) {
  console.error(`Getting games from ${fileName}...`);
  const gamesData = await readFile(fileName, "utf-8");
  const gamesDataJSON: ExtractedGame[] = JSON.parse(gamesData);

  for (let id = 0; id < gamesDataJSON.length; id++) {
    const game = gamesDataJSON[id];

    if (game.homeTeamData) continue;

    try {
      console.error(`Getting box score data for game ${game.nbaGameId}`);
      const boxScoreData = await getBoxScoreData(game.nbaGameId);
      gamesDataJSON[id] = {
        ...game,
        ...boxScoreData,
      };
    } catch (err) {
      console.error(err, game.nbaGameId);
    }
  }

  console.error("Writing to file...");
  await writeFile(fileName, JSON.stringify(gamesDataJSON));

  console.error("Finished");
}

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

async function updatePlayerTable(game: ExtractedGame) {
  await Promise.all(
    game.homeTeamData.players.map(async (player) =>
      updatePlayerData({ player, newNbaTeamId: game.homeTeamData.nbaTeamId })
    )
  );
  await Promise.all(
    game.awayTeamData.players.map(async (player) =>
      updatePlayerData({ player, newNbaTeamId: game.awayTeamData.nbaTeamId })
    )
  );
}

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

async function writeGamesDataToDB(fileName: string) {
  const gamesData = await readFile(fileName, "utf-8");
  const gamesDataJSON: ExtractedGame[] = JSON.parse(gamesData);

  for (const game of gamesDataJSON) {
    if (!game.gameHasFinished) continue;

    await updateDBFromGame(game);
  }
}

async function writeMissingGamesDataToDB(fileName: string) {
  const gamesData = await readFile(fileName, "utf-8");
  console.error("reading file");
  const gamesDataJSON: ExtractedGame[] = JSON.parse(gamesData);
  console.error(`got ${gamesDataJSON.length} games from file`);

  console.error("getting newest game in db");
  const newestGameInDBDate = new Date(
    (await prisma.game.findFirst({
      orderBy: {
        gameDateTimeUTC: "desc",
      },
      select: {
        gameDateTimeUTC: true,
      },
    }))!.gameDateTimeUTC
  );

  console.error("getting games that are missing from db");
  const gamesMissingFromDB = gamesDataJSON.filter(
    (game) => new Date(game.gameDateTimeUTC) > newestGameInDBDate
  );

  console.error("writing to db");
  for (const game of gamesMissingFromDB) {
    await updateDBFromGame(game);
  }
}

async function main() {
  // writeGamesDataToFile();
  // await writeGamesDataToDB();
  // const tatumId = await prisma.player.findFirst({
  //   where: {
  //     AND: [
  //       {firstName: "Joel"},
  //       {familyName: "Embiid"},
  //     ]
  //   },
  //   select: {
  //     id: true,
  //   }
  // })
  // const agg = await prisma.playerStat.aggregate({
  //   where: {
  //     AND: [
  //       {playerId: tatumId?.id},
  //       {game: {
  //         nbaGameId: {startsWith: "0022"}
  //       }},
  //       {minutes: {not: ''}}
  //     ]
  //   },
  //   _sum: {
  //     points: true,
  //     assists: true,
  //   },
  //   _avg: {
  //     points: true,
  //     assists: true,
  //   }
  // });
  // console.log(agg);
  // const tatumGames = await prisma.playerStat.findMany({
  //   where: {
  //     playerId: tatumId?.id,
  //   }
  // });
  // console.log(tatumGames, tatumGames.length);
  const fileName = "./scripts/local/gamesSoFar.json";
  // await fillMissingGamesData(fileName);
  // await writeMissingGamesDataToDB(fileName);
  // await writeMissingGamesDataToFile(fileName);
  console.error("finished");

  // console.log(await prisma.playerStat.deleteMany());
  // console.log(await prisma.player.deleteMany());
  // console.log(await prisma.game.deleteMany());
  // console.log(await prisma.team.deleteMany());
}

main()
  .then(async (e) => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
