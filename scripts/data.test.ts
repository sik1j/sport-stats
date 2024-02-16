import fs from "fs";
import path from "path";
import { getBoxScoreData, getGamesSchedule } from "./data";

function valueIsDefined(value: any) {
  return value !== undefined && value !== null;
}

async function testGetGamesSchedule() {
  const data = await getGamesSchedule();

  return data.reduce((acc, game) => {
    if (
      !(
        valueIsDefined(game.gameHasFinished) &&
        valueIsDefined(game.nbaGameId) &&
        valueIsDefined(game.isPreseasonGame) &&
        valueIsDefined(game.gameDateTimeUTC)
      )
    ) {
      console.log(game);
      return false;
    } else {
      return acc;
    }
  }, true);
}

async function testGetBoxScoreData() {
  const data = await getBoxScoreData("0012300001");

  const aT = data.awayTeamData;
  const hT = data.homeTeamData;

  if (
    !(
      valueIsDefined(aT.teamName) &&
      valueIsDefined(aT.teamCity) &&
      valueIsDefined(aT.score) &&
      valueIsDefined(aT.players) &&
      valueIsDefined(hT.teamName) &&
      valueIsDefined(hT.teamCity) &&
      valueIsDefined(hT.score) &&
      valueIsDefined(hT.players)
    )
  ) {
    console.log(data);
    return false;
  }

  return true;
}


async function checkDataCorrectness() {
  // Read the JSON file
  const rawData = fs.readFileSync(
    path.resolve(__dirname, "./preseasonGames.json")
  );

  // Parse the JSON data
  const preSeasonData: any[] = JSON.parse(rawData.toString());

  console.log(
    preSeasonData.length,
    preSeasonData.every((elem) => elem.isPreseasonGame),
    preSeasonData.every((elem) => elem.gameHasOccured)
  );

  console.log("Taytum stats:");
  const gamesWithTatum = preSeasonData.filter((game) => {
    return (
      game.homeTeamData.teamName === "Celtics" ||
      game.awayTeamData.teamName === "Celtics"
    );
    // let team;
    // if (game.homeTeamData.teamName === 'Boston Celtics' ) {
    //   team = game.homeTeamData;
    // } else if (game.awayTeamData.teamName === 'Boston Celtics') {
    //   team = game.awayTeamData;
    // } else {
    //   return false;
    // }

    // return team.players.find((player: any) => player.familyName === 'Tatum');
  });
  const results = gamesWithTatum.map((game) => {
    return {
      gameDateTimeUTC: game.gameDateTimeUTC,
      homeTeam: game.homeTeamData.teamName,
      awayTeam: game.awayTeamData.teamName,
      homeTeamScore: game.homeTeamData.score,
      awayTeamScore: game.awayTeamData.score,
      tatumStats:
        game.homeTeamData.players.find(
          (player: any) => player.familyName === "Tatum"
        )?.statistics ||
        game.awayTeamData.players.find(
          (player: any) => player.familyName === "Tatum"
        )?.statistics,
    };
  });

  console.log(results, gamesWithTatum.length);
}

async function main() {
  // const test1 = await testGetGamesSchedule();
  const test2 = await testGetBoxScoreData();

  // console.log("Test 1: ", test1);
  console.log("Test 2: ", test2);
}

main();
