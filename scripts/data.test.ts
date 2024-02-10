import { getBoxScoreData, getGamesSchedule } from "./data";

function valueIsDefined(value: any) {
  return value !== undefined && value !== null;
}

async function testGetGamesSchedule() {
  const data = await getGamesSchedule();

  return data.reduce((acc, game) => {
    if (
      !(
        valueIsDefined(game.gameHasOccured) &&
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

async function main() {
  // const test1 = await testGetGamesSchedule();
  const test2 = await testGetBoxScoreData();

  // console.log("Test 1: ", test1);
  console.log("Test 2: ", test2);
}

main();
