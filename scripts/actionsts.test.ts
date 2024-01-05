import {
  getPlayerStatsFromEspnId,
  getAllPlayers_DB,
  getPlayerStatsFromEspnGameId,
  getGameLinksFromTeamHomePageLink,
  getGameDataFromGameId,
} from "./actionsts";
import { JSDOM } from "jsdom";
import { sql } from "@vercel/postgres";

async function main() {
  //   // test if name matches the name in the database
  //   await nameTest();
  //   // check if it can handle players with no stats
  //   await noStatTest();
  // test
  // await test();
  // await getGameLinksTest();
  // await getGameDataTest();
}

main();

async function getGameDataTest() {
  const teamLinks = (await sql<{ link: string }>`SELECT link FROM teams`).rows;

  teamLinks.forEach(async ({ link }) => {
    const gameLinks = await getGameLinksFromTeamHomePageLink(link);
    await new Promise((resolve) => setTimeout(resolve, 250));

    let error = false;
    gameLinks.forEach(async (gameLink) => {
      const espnGameId = parseInt(gameLink!.split("/")[7]);
      const {awayTeamName, awayTeamScore, date, espnGameId: gameId, homeTeamName, homeTeamScore} = await getGameDataFromGameId(espnGameId);

      if (!awayTeamName || !awayTeamScore || !date || !gameId || !homeTeamName || !homeTeamScore) {
        console.log("error with gameLink", gameLink, "team link", link);
        console.log({awayTeamName, awayTeamScore, date, espnGameId: gameId, homeTeamName, homeTeamScore});
        error = true;
      }
    })

    if (error) {
      console.error("error with gameLinks", gameLinks, 'team link', link);  
    } else {
      console.log(`everything is well-defined for ${link}`);
    }
    console.log('='.repeat(50));
    
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
      console.error("error with gameLinks", gameLinks, 'team link', link);
    } else {
      console.log(`everything is well-defined for ${link}`);
      console.log('='.repeat(50));
    }
  });
}

async function test() {
  const data = await getPlayerStatsFromEspnGameId(401584701);
  console.log(data.team2);
}

async function noStatTest() {
  console.log("Fetching all players from the database...");
  const allPlayers = await getAllPlayers_DB();

  console.log("Fetching player stats from ESPN...");
  allPlayers.rows.forEach(async (player) => {
    const playerStats = await getPlayerStatsFromEspnId(player.espn_id);
    const fullName = `${playerStats.firstName} ${playerStats.lastName}`;

    if (playerStats.playerGameStatsArr.length == 0) {
      console.log(`No stats for ${fullName}`);
    }
  });
}

async function nameTest() {
  console.log("Fetching all players from the database...");
  const allPlayers = await getAllPlayers_DB();

  // const link = 'https://www.espn.com/nba/player/_/id/3102530';
  // const playerStats = await getPlayerStats(link);
  // console.log(playerStats);
  console.log("Fetching player stats from ESPN...");
  let misMatchCount = 0;
  allPlayers.rows.forEach(async (player) => {
    try {
      const playerStats = await getPlayerStatsFromEspnId(player.espn_id);
      const fullName = `${playerStats.firstName} ${playerStats.lastName}`;
      if (fullName != player.name) {
        console.log(`Name MISMATCH: ${fullName} vs ${player.name}`);
        misMatchCount++;
      } else {
        console.log(`Name match: ${fullName}`);
      }
    } catch (e) {
      console.log(`Error: ${e}, ${player.name}`);
    }
  });

  console.log(`Total mismatch: ${misMatchCount}`);
}
