import {
  getPlayerStatsFromEspnId,
  getAllPlayers_DB,
  getPlayerStatsFromEspnGameId,
  getGameLinksFromTeamHomePageLink,
  getGameDataFromGameId,
} from "./actionsts";
import { JSDOM } from "jsdom";
import { sql } from "@vercel/postgres";
import { Game } from "./definitions";

async function main() {
  //   // test if name matches the name in the database
  //   await nameTest();
  //   // check if it can handle players with no stats
  //   await noStatTest();
  // test
  // await test();
  // await getGameLinksTest();
  // await getGameDataTest();
  await getPlayerStatsTest();
}

main();

async function getPlayerStatsTest() {
  //   const gameId = 401584708;
  //   const { team1, team2 } = await getPlayerStatsFromEspnGameId(gameId);
  //   console.log(team1, team2);
  // }
  const gameIds = (
    await sql<{ espn_id: number }>`
    SELECT espn_id FROM games
  `
  ).rows.map((row) => row.espn_id);

  let errorCount = 0;
  console.log(`Testing ${gameIds.length} games...`);
  await withDelay(
    0,
    async (gameId) => {
      const isAllDataDefined = (team: any[]) => {
        return team.every((player) => {
          const playerBase =
            player.lowerCaseName !== null && player.espnId !== null;
          if (player.stats === null) {
            return playerBase;
          } else {
            return (
              playerBase &&
              player.points !== null &&
              player.rebounds !== null &&
              player.assists !== null &&
              player.steals !== null &&
              player.blocks !== null &&
              player.turnovers !== null &&
              player.fieldGoals !== null &&
              player.threePointers !== null &&
              player.freeThrows !== null &&
              player.min !== null &&
              player.fouls !== null &&
              player.plusMinus !== null
            );
          }
        });
      };

      try {
        const { team1, team2 } = await getPlayerStatsFromEspnGameId(gameId);
        
        if (!isAllDataDefined(team1) || !isAllDataDefined(team2)) {
          errorCount++;
        throw new Error("Not all data is defined");
        }
        
        console.log("got data for game id", gameId);
      } catch (e) {
        errorCount++;
        console.log("error with game id", gameId, `error: ${e}`);
      }
      console.log("=".repeat(50));
    },
    gameIds
  );

  if (errorCount === 0) {
    console.log("All tests passed!");
  } else {
    console.log(`${errorCount} tests failed.`);
  }
}

async function getGameDataTest() {
  const teamLinks = (await sql<{ link: string }>`SELECT link FROM teams`).rows;

  teamLinks.forEach(async ({ link }) => {
    const gameLinks = await getGameLinksFromTeamHomePageLink(link);
    await new Promise((resolve) => setTimeout(resolve, 250));

    let error = false;
    gameLinks.forEach(async (gameLink) => {
      const espnGameId = parseInt(gameLink!.split("/")[7]);
      const {
        awayTeamName,
        awayTeamScore,
        date,
        espnGameId: gameId,
        homeTeamName,
        homeTeamScore,
      } = await getGameDataFromGameId(espnGameId);

      if (
        !awayTeamName ||
        !awayTeamScore ||
        !date ||
        !gameId ||
        !homeTeamName ||
        !homeTeamScore
      ) {
        console.log("error with gameLink", gameLink, "team link", link);
        console.log({
          awayTeamName,
          awayTeamScore,
          date,
          espnGameId: gameId,
          homeTeamName,
          homeTeamScore,
        });
        error = true;
      }
    });

    if (error) {
      console.error("error with gameLinks", gameLinks, "team link", link);
    } else {
      console.log(`everything is well-defined for ${link}`);
    }
    console.log("=".repeat(50));
  });
}

async function getGameLinksTest() {
  const teamLinks = (await sql<{ link: string }>`SELECT link FROM teams`).rows;
  teamLinks.forEach(async ({ link }) => {
    let error = false;
    const gameLinks = await getGameLinksFromTeamHomePageLink(link);

    gameLinks.forEach((gameLink) => {
      if (gameLink === undefined || gameLink === null) {
        console.log("error with gameLink", gameLink, "team link", link);
        error = true;
      }
    });

    if (error) {
      console.error("error with gameLinks", gameLinks, "team link", link);
    } else {
      console.log(`everything is well-defined for ${link}`);
      console.log("=".repeat(50));
    }
  });
}

async function test() {
  const data = await getPlayerStatsFromEspnGameId(401584701);
  console.log(data.team2);
}

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
  index: number,
  func: (arg: T) => Promise<U>,
  inArr: T[],
  outArr: U[] = []
) {
  if (index >= inArr.length) return outArr;

  console.log(`Running with ${index},`, inArr[index], "...");
  const result = await func(inArr[index]);
  outArr.push(result);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return withDelay(index + 1, func, inArr, outArr);
}
