import { JSDOM } from "jsdom";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { scheduleRoot, Game } from "./jsonTypes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Retrieves the games schedule from the NBA endpoints.
 * @returns An array of game objects containing the game ID, preseason status, and game occurrence status.
 */
export async function getGamesSchedule() {
  const response = await fetch(
    "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_2.json"
  );
  const data: scheduleRoot = await response.json();

  const games = data.leagueSchedule.gameDates
    .map((gameDate) => {
      return gameDate.games.map((game) => {
        return {
          nbaGameId: game.gameId,
          isPreseasonGame: game.seriesText === "Preseason",
          gameHasOccured: game.gameStatusText === "Final",
          gameDateTimeUTC: game.gameDateTimeUTC,
        };
      });
    })
    .flat();

  return games;
}

/**
 * Retrieves the box score data of a game.
 * @param gameId The nba.com ID of the game.
 * @returns An array of player game stats.
 */
export async function getBoxScoreData(gameId: string) {
  // const response = await fetch(`https://www.nba.com/game/${gameId}`);
  // const html = await response.text();
  // console.log(html);

  const rawData = fs.readFileSync(
    path.resolve(__dirname, "./local/gameBoxScore.html")
  );

  // Parse the JSON data
  const html = rawData.toString();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const script = document.querySelector("script[id='__NEXT_DATA__']");
  const gameObj: Game = JSON.parse(script!.textContent!).props.pageProps.game;
  console.dir(JSON.stringify(gameObj), {
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
  });
  const homeTeam = gameObj.homeTeam;
  const awayTeam = gameObj.awayTeam;

  const homeTeamData = {
    teamName: homeTeam.teamName,
    teamCity: homeTeam.teamCity,
    score: homeTeam.score,
    players: homeTeam.players,
  };

  const awayTeamData = {
    teamName: awayTeam.teamName,
    teamCity: awayTeam.teamCity,
    score: awayTeam.score,
    players: awayTeam.players,
  };

  return { homeTeamData, awayTeamData };
}
