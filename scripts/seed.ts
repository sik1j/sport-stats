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
 * Retrieves the games schedule from the NBA endpoints.
 * @returns An array of game objects containing the game ID, preseason status, and game occurrence status.
 */
export async function getGamesSchedule() {
  const response = await fetch(
    "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_2.json"
  );
  const data: Root = await response.json();

  const games = data.leagueSchedule.gameDates
    .map((gameDate) => {
      return gameDate.games.map((game) => {
        return {
          gameId: game.gameId,
          preseason: game.seriesText === "Preseason",
          gameHasOccured: game.gameStatusText === "Final",
        };
      });
    })
    .flat();

  return games;
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
