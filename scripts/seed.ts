import { VercelPoolClient, sql } from "@vercel/postgres";
import { convertMMDDtoDate } from "./utilityts";
import { db } from "@vercel/postgres";
import { scheduleRoot } from "./jsonTypes";

import { getBoxScoreData } from "./data";




async function main() {
  // const data = await getGamesSchedule();
  const data = await getBoxScoreData("0022300733");
  console.dir(JSON.stringify(data), {
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
  });
}

main();
// - then, 'https://www.nba.com/game/${gameId}' for boxScore data of game
