import { VercelPoolClient, sql } from "@vercel/postgres";
import {
  getPlayerStatsFromEspnId,
  getAllPlayers_DB,
  PlayerGameStats,
  getGameLinksFromTeamHomePageLink,
  getGameDataFromGameId,
  getPlayerStatsFromEspnGameId
} from "./actionsts";
import { Player, Game, Team } from "./definitions";
import { convertMMDDtoDate } from "./utilityts";
import { db } from "@vercel/postgres";

/**
 * Executes a function with a delay for each element in an array.
 *
 * @param index - The current index in the array.
 * @param func - The function to be executed for each element.
 * @param inArr - The input array.
 * @param outArr - The output array.
 * @returns A promise that resolves to the output array.
 */
async function withDelay<T, U>(
  func: (arg: T) => Promise<U>,
  inArr: T[],
  outArr: U[] = [],
  index: number = 0,
) {
  if (index >= inArr.length) return outArr;

  console.log(`Running with ${index},`, inArr[index], "...");
  const result = await func(inArr[index]);
  outArr.push(result);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return withDelay(func, inArr, outArr, index + 1);
}

/**
 * Seeds the player statistics into the database.
 * Fetches all games from the database, retrieves the player statistics for each game,
 * and inserts the player stats into the player_stats table.
 * @returns A promise that resolves when the player stats are successfully seeded, or rejects with an error if there was an issue.
 */
export async function seedPlayerStats() {
  try {
    console.log('Fetching all games from the database...');
    const games = (await sql<Game>`SELECT * FROM games order by date`).rows;
    const gameIds = games.map((game) => game.espn_id);


    console.log('getting stats for each game...');
    /**
     * Retrieves the player statistics from all games using the provided game IDs.
     * @param gameIds The array of game IDs.
     * @returns A promise that resolves to an array of player statistics from all games. 
     * Each element in the array is an object with two properties: team1 and team2. 
     * Each of these properties is an array of player statistics for that team.
     */
    const allPlayerStatsFromAllGames = (await withDelay(
      async (gameId) => {
        const playerStats = await getPlayerStatsFromEspnGameId(gameId);
        playerStats.team1.forEach((playerStat) => {
          if (!playerStat.lowerCaseName) {
            console.log("error with playerStat", playerStat);
          }
        });
        return { ...playerStats, gameId };
      },
      gameIds
    )).filter((playerStats) => {
      const predicate =
        playerStats.team1.length > 0 &&
        playerStats.team2.length > 0;

      if (!predicate) console.log("error with playerStats", playerStats);

      return predicate;
    });

    console.log("Creating player stats table...");
    await sql`
    CREATE TABLE IF NOT EXISTS player_stats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      player_id UUID NOT NULL REFERENCES players(id),
      espn_game_id INT NOT NULL REFERENCES games(espn_id),
      minutes_played INT NOT NULL,
      field_goals_made INT NOT NULL,
      field_goals_attempted INT NOT NULL,
      three_pointers_made INT NOT NULL,
      three_pointers_attempted INT NOT NULL,
      free_throws_made INT NOT NULL,
      free_throws_attempted INT NOT NULL,
      rebounds INT NOT NULL,
      assists INT NOT NULL,
      steals INT NOT NULL,
      blocks INT NOT NULL,
      turnovers INT NOT NULL,
      fouls INT NOT NULL,
      plusMinus INT NOT NULL,
      points INT NOT NULL
    );
  `;

    console.log("Inserting player stats into the database...");

    const allPlayers = (await sql<Player>`SELECT * FROM players`).rows;

    const insertedPlayerStats = await Promise.all(
      allPlayerStatsFromAllGames.map(
        async (playerStatsForGame) => {

          const team1 = await withDelay(
              async (playerInfo) => {
                const player = allPlayers.find((player) => player.espn_id === playerInfo.espnId);
                if (player === undefined) {
                  console.log("error with player", playerInfo.lowerCaseName);
                  return;
                }
                const playerId = player.id;
                let stats = playerInfo.stats;

                if (!stats) {
                  return;
                }

                await sql`
                INSERT INTO player_stats (
                  player_id,
                  espn_game_id,
                  minutes_played,
                  field_goals_made,
                  field_goals_attempted,
                  three_pointers_made,
                  three_pointers_attempted,
                  free_throws_made,
                  free_throws_attempted,
                  rebounds,
                  assists,
                  steals,
                  blocks,
                  turnovers,
                  fouls,
                  plusMinus,
                  points
                )
                VALUES (
                  ${playerId},
                  ${playerStatsForGame.gameId},
                  ${stats.min},
                  ${stats.fieldGoalsMade},
                  ${stats.fieldGoalsAttempted},
                  ${stats.threePointersMade},
                  ${stats.threePointersAttempted},
                  ${stats.freeThrowsMade},
                  ${stats.freeThrowsAttempted},
                  ${stats.rebounds},
                  ${stats.assists},
                  ${stats.steals},
                  ${stats.blocks},
                  ${stats.turnovers},
                  ${stats.fouls},
                  ${stats.plusMinus},
                  ${stats.points}
                )
              `
              },
              playerStatsForGame.team1
          );

          const team2 = await withDelay(
              async (playerInfo) => {
                const player = allPlayers.find((player) => player.espn_id === playerInfo.espnId);
                if (player === undefined) {
                  console.log("error with player", playerInfo.lowerCaseName);
                  return;
                }
                const playerId = player.id;
                let stats = playerInfo.stats;

                if (!stats) {
                  return;
                }

                await sql`
                INSERT INTO player_stats (
                  player_id,
                  espn_game_id,
                  minutes_played,
                  field_goals_made,
                  field_goals_attempted,
                  three_pointers_made,
                  three_pointers_attempted,
                  free_throws_made,
                  free_throws_attempted,
                  rebounds,
                  assists,
                  steals,
                  blocks,
                  turnovers,
                  fouls,
                  plusMinus,
                  points
                )
                VALUES (
                  ${playerId},
                  ${playerStatsForGame.gameId},
                  ${stats.min},
                  ${stats.fieldGoalsMade},
                  ${stats.fieldGoalsAttempted},
                  ${stats.threePointersMade},
                  ${stats.threePointersAttempted},
                  ${stats.freeThrowsMade},
                  ${stats.freeThrowsAttempted},
                  ${stats.rebounds},
                  ${stats.assists},
                  ${stats.steals},
                  ${stats.blocks},
                  ${stats.turnovers},
                  ${stats.fouls},
                  ${stats.plusMinus},
                  ${stats.points}
                )
              `
              },
              playerStatsForGame.team2
          );
          return team1.flat().concat(team2.flat());
        }
      )
    );

    console.log(`Inserted ${insertedPlayerStats.flat().length} player stats into the database.`);
  }
  catch (error) {
    console.error('Error seeding player stats: ', error);
  }
}

/**
 * Inserts games that are missing up to the most recent game that happened today.
 * Retrieves game data from external sources and inserts it into the database if the game is missing.
 * @returns {Promise<void>} A promise that resolves once the missing games are inserted into the database.
 */
export async function insertMissingGames() {
  try {
    const gamesIds = (await sql<Game>`SELECT * FROM games`).rows.map((game) => game.espn_id);
    console.log(`Found ${gamesIds.length} games in the database.`);

    const allGameLinksArr = await getAllTeamsGamesLinks();
    const allGameEspnIds = allGameLinksArr.map((gameLink) => parseInt(gameLink.split("/")[7]));


    const missingGameIds = allGameEspnIds.filter((espnId) => gamesIds.indexOf(espnId) === -1);

    console.log(`Found ${missingGameIds.length} missing games.`, missingGameIds);

    const missingGamesData = (
      await withDelay(
        async (gameId) => {
          const gameData = await getGameDataFromGameId(gameId);
          return gameData;
        },
        missingGameIds
      )
    ).filter((gameData) => {
      const predicate =
        gameData.awayTeamName !== null &&
        gameData.homeTeamName !== null &&
        gameData.awayTeamName !== undefined &&
        gameData.homeTeamName !== undefined;

      if (!predicate) console.log("error with gameData", gameData);

      return predicate;
    });
    console.log(`Got ${missingGamesData.length} games' data.`);

    // console.log(
    //   missingGamesData.map((gameData) => `${gameData.homeTeamName} vs ${gameData.awayTeamName} on ${gameData.date.toDateString()}`)
    // );

    console.log('Inserting missing games into the database...');

    const insertedGames = await Promise.all(
      missingGamesData.map(
        async ({
          date,
          awayTeamName,
          awayTeamScore,
          homeTeamName,
          homeTeamScore,
          espnGameId,
        }) => {
          if (
            !homeTeamName ||
            !awayTeamName ||
            !homeTeamScore ||
            !awayTeamScore
          ) {
            console.log(
              `Error with some data: ${homeTeamName}, ${awayTeamName}, ${homeTeamScore}, ${awayTeamScore}`
            );
            return null;
          }
          const homeTeamId = (
            await sql<{
              id: string;
            }>`SELECT id FROM teams WHERE name = ${homeTeamName}`
          ).rows[0].id;
          const awayTeamId = (
            await sql<{
              id: string;
            }>`SELECT id FROM teams WHERE name = ${awayTeamName}`
          ).rows[0].id;

          return sql`
        INSERT INTO games (date, home_team_score, away_team_score, home_team_id, away_team_id, espn_id)
        VALUES (${date.toISOString()}, ${homeTeamScore}, ${awayTeamScore}, ${homeTeamId}, ${awayTeamId}, ${espnGameId})
      `;
        }
      )
    );
    console.log(`Inserted ${insertedGames.length} games into the database.`);

  } catch (error) {
    console.error('Error inserting missing games: ', error);
  }

}

/**
 * Seeds the games data by fetching game links, retrieving game data, and inserting the games into the database.
 * @returns {Promise<void>} A promise that resolves when the seeding is complete.
 */
export async function seedGames() {
  try {
    const allGameLinksArr = await getAllTeamsGamesLinks();

    console.log("Fetching all games' data...");
    // const allGamesData = (
    //   await Promise.all(
    //     allGameLinksArr.map(async (gameLink) => {
    //       const espnGameId = parseInt(gameLink.split("/")[7]);
    //       const gameData = await getGameDataFromGameId(espnGameId);
    //       return gameData;
    //     })
    //   )
    // )
    const allGamesData = (
      await withDelay(
        async (gameLink) => {
          const espnGameId = parseInt(gameLink.split("/")[7]);
          const gameData = await getGameDataFromGameId(espnGameId);
          return gameData;
        },
        allGameLinksArr
      )
    ).filter((gameData) => {
      const predicate =
        gameData.awayTeamName !== null &&
        gameData.homeTeamName !== null &&
        gameData.awayTeamName !== undefined &&
        gameData.homeTeamName !== undefined;

      if (!predicate) console.log("error with gameData", gameData);

      return predicate;
    });
    console.log(`Got ${allGamesData.length} games' data.`);

    console.log("Removing duplicates...");
    const duplicatesRemovedGames = allGamesData.filter(
      (gameData, index, arr) =>
        arr.findIndex((game) => game.espnGameId === gameData.espnGameId) ===
        index
    );
    console.log(
      `Filtered array from ${allGamesData.length} to ${duplicatesRemovedGames.length} games.`
    );

    const client = await db.connect();

    await client.sql`
    CREATE TABLE IF NOT EXISTS games (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      date DATE NOT NULL,
      home_team_score INT NOT NULL,
      away_team_score INT NOT NULL,
      home_team_id UUID NOT NULL REFERENCES teams(id),
      away_team_id UUID NOT NULL REFERENCES teams(id),
      espn_id INT NOT NULL
    );
  `;
    console.log("Created games table.");

    console.log("Inserting teams into the database...");
    const insertedGames = await Promise.all(
      duplicatesRemovedGames.map(
        async ({
          date,
          awayTeamName,
          awayTeamScore,
          homeTeamName,
          homeTeamScore,
          espnGameId,
        }) => {
          if (
            !homeTeamName ||
            !awayTeamName ||
            !homeTeamScore ||
            !awayTeamScore
          ) {
            console.log(
              `Error with some data: ${homeTeamName}, ${awayTeamName}, ${homeTeamScore}, ${awayTeamScore}`
            );
            return null;
          }
          const homeTeamId = (
            await client.sql<{
              id: string;
            }>`SELECT id FROM teams WHERE name = ${homeTeamName}`
          ).rows[0].id;
          const awayTeamId = (
            await client.sql<{
              id: string;
            }>`SELECT id FROM teams WHERE name = ${awayTeamName}`
          ).rows[0].id;

          return client.sql`
        INSERT INTO games (date, home_team_score, away_team_score, home_team_id, away_team_id, espn_id)
        VALUES (${date.toISOString()}, ${homeTeamScore}, ${awayTeamScore}, ${homeTeamId}, ${awayTeamId}, ${espnGameId})
      `;
        }
      )
    );
    console.log(`Inserted ${insertedGames.length} games into the database.`);
  } catch (error) {
    console.error(`Error seeding players: ${error}`);
  }
  // console.log(allGameLinksArr.map((gameLinks) => gameLinks.length), allGameLinksArr.length);
}

async function getAllTeamsGamesLinks() {
  console.log("Fetching all players from the database...");
  const allTeamLinks = (await sql<{ link: string; }> `SELECT link FROM teams`)
    .rows;
  console.log(`Got ${allTeamLinks.length} team links.`);

  console.log("Fetching all game links...");
  const allGameLinksArr = (
    await withDelay(
      async ({ link }) => {
        return await getGameLinksFromTeamHomePageLink(link);
      },
      allTeamLinks
    )
  )
    .flat()
    .filter((gameLink): gameLink is string => {
      const predicate = gameLink !== undefined && gameLink !== null;
      if (!predicate) console.log("error with gameLink", gameLink);
      return predicate;
    })
    .filter((gameLink, index, arr) => arr.indexOf(gameLink) === index);

  console.log(`Got ${allGameLinksArr.length} game links.`);
  return allGameLinksArr;
}

async function main() {
  // const client = await db.connect();
  // await seedGames();

  // const allTeamLinks = (
  //   await client.sql<{ link: string }>`SELECT link FROM teams`
  // ).rows;

  // const testTeamLink = allTeamLinks[0];
  // const testTeamGameLinks = await getGameLinksFromTeamHomePageLink(testTeamLink.link);
  // // const testTeamGamesData = await Promise.all(testTeamGameLinks.map(async (gameLink) => {
  // //   const espnGameId = parseInt(gameLink!.split("/")[7]);
  // //   const gameData = await getGameDataFromGameId(espnGameId);
  // //   return gameData;
  // // }));

  // const testTeamGamesData = await withDelay(0, async (gameLink) => {
  //   const espnGameId = parseInt(gameLink!.split("/")[7]);
  //   const gameData = await getGameDataFromGameId(espnGameId);
  //   return gameData;
  // }, testTeamGameLinks);

  // console.log(testTeamGamesData, testTeamGamesData.length);
  // // console.log(await withDelay(0, async (val) => val + 1, [1, 2, 3, 4, 5]));
  // await insertMissingGames();
  await seedPlayerStats();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
});
