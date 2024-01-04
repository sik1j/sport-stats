import {
  getPlayerStatsFromEspnId,
  getAllPlayers_DB,
  getPlayerStatsFromEspnGameId,
  getGameLinksFromTeamHomePageLink
} from "./actionsts";
import { JSDOM } from "jsdom";

async function main() {
  //   // test if name matches the name in the database
  //   await nameTest();

  //   // check if it can handle players with no stats
  //   await noStatTest();

  // test
  // await test();

  await getGameLinksTest();
}

main();

async function getGameLinksTest() {
  const link = 'https://www.espn.com/nba/team/_/name/bos/boston-celtics';
  const gameLinks = await getGameLinksFromTeamHomePageLink(link);
  console.log(gameLinks, gameLinks.length);
};

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
