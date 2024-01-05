import { JSDOM } from "jsdom";
import { sql } from "@vercel/postgres";
import { Team, Player, Game } from "./definitions";

export type PlayerGameStats = {
  // date is in format "DAY MM/DD"
  date: string;
  opponentAcronym: string;
  result: string;
  score: string;
  isHome: boolean;
  minutes: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  fouls: number;
  turnovers: number;
  points: number;
};

export async function getGameDataFromGameId(espnGameId: number) {
  const link = `https://www.espn.com/nba/game/_/gameId/${espnGameId}`;
  const response = await fetch(link);
  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const awayTeamName = document.querySelector(
    "div.Gamestrip__Team:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1) > h2:nth-child(1)"
  )?.textContent;
  const homeTeamName = document.querySelector(
    "div.Gamestrip__Team:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1) > h2:nth-child(1)"
  )?.textContent;
  // console.log(awayTeamName, homeTeamName);

  const dateString = document
    .querySelector(".GameInfo__Meta > span:nth-child(1)")
    ?.textContent?.split(",")
    .slice(1)
    .join("");
  const date = new Date(dateString!);
  // console.log(dateString, date);

  const awayTeamScore = parseInt(
    document
      .querySelector(
        "div.Gamestrip__Team:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)"
      )!
      .textContent!
  );
  const homeTeamScore = parseInt(
    document.querySelector(
      "div.Gamestrip__Team:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)"
    )!.textContent!
  );

  return {
    date,
    homeTeamScore,
    awayTeamScore,
    homeTeamName,
    awayTeamName,
    espnGameId,
  };
}

/**
 * Retrieves the game links from the team's home page link.
 * @param teamHomePageLink - The link to the team's home page.
 * @returns A promise that resolves to an array of game links, or null/undefined values.
 */
export async function getGameLinksFromTeamHomePageLink(
  teamHomePageLink: string
): Promise<(string | null | undefined)[]> {
  const link = teamHomePageLink.replace("team", "team/schedule");

  const response = await fetch(link);
  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const gamesArr = Array.from(document.querySelectorAll("tr.Table__TR"));
  const regularSeasonGameLinks = gamesArr
    .filter(
      (game, ind) =>
        {
          const gameColumns = game.querySelectorAll("td.Table__TD");
          return gameColumns.length === 7 && gameColumns[0].textContent !== "DATE";
        }
    )
    .map((game) =>
      game
        .querySelector("td:nth-child(3) > span:nth-child(2) > a:nth-child(1)")
        ?.getAttribute("href")
    );

  return regularSeasonGameLinks;
}

/**
 * Retrieves player stats from a game of given ESPN game ID.
 * @param espnGameId The ESPN game ID.
 * @returns An array of player stats. stats === null if the player did not play.
 */
export async function getPlayerStatsFromEspnGameId(espnGameId: number) {
  const statPageLink = `https://www.espn.com/nba/boxscore/_/gameId/${espnGameId}`;

  const response = await fetch(statPageLink);
  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  let playersOnTeamArr: { name: string; ind: number }[][] = [];

  for (let i = 0; i < 2; i++) {
    playersOnTeamArr.push(
      Array.from(
        document.querySelectorAll(
          `.Boxscore__ResponsiveWrapper > div:nth-child(${
            i + 1
          }) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(3) > tr > td:nth-child(1) > div:nth-child(1)`
        )
      )
        .map((playerElem, ind) => ({ node: playerElem, ind }))
        .filter(({ node }) => node.querySelector("a") !== null)
        .map(({ node, ind }) => ({
          name: node.querySelector("a")!.textContent!,
          ind,
        }))
    );
  }

  let playersOnTeamStatsArr: (string | null)[][][] = [];
  for (let i = 0; i < 2; i++) {
    playersOnTeamStatsArr.push(
      Array.from(
        document.querySelectorAll(
          `.Boxscore__ResponsiveWrapper > div:nth-child(${
            i + 1
          }) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(3) > tr`
        )
      )
        .map((node) => {
          return Array.from(node.querySelectorAll("td")).map(
            (node) => node.textContent
          );
        })
        .filter(
          (_node, ind) =>
            playersOnTeamArr[0].find(({ ind: j }) => j === ind) !== undefined
        )
    );
  }

  // let arr = Array.from(
  //   document.querySelectorAll(
  //     `.Boxscore__ResponsiveWrapper > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(3) > tr`
  //   )
  // )
  //   .map((node) => {
  //     return Array.from(node.querySelectorAll("td")).map(
  //       (node) => node.textContent
  //     );
  //   })
  //   .filter(
  //     (_node, ind) =>
  //       playersOnTeamArr[0].find(({ ind: j }) => j === ind) !== undefined
  //   )

  const joined = playersOnTeamArr.map((team, i) => {
    return team.map(({ name }, j) => {
      const [
        minutes,
        fieldGoals,
        threePointers,
        freeThrows,
        _oReb,
        _dReb,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        fouls,
        plusMinus,
        points,
      ] = playersOnTeamStatsArr[i][j];
      if (isNaN(Number(minutes))) {
        return { name, stats: null };
      }

      return {
        name,
        stats: {
          minutes: Number(minutes),
          fieldGoalsMade: Number(fieldGoals!.split("-")[0]),
          fieldGoalsAttempted: Number(fieldGoals!.split("-")[1]),
          threePointersMade: Number(threePointers!.split("-")[0]),
          threePointersAttempted: Number(threePointers!.split("-")[1]),
          freeThrowsMade: Number(freeThrows!.split("-")[0]),
          freeThrowsAttempted: Number(freeThrows!.split("-")[1]),
          rebounds: Number(rebounds),
          assists: Number(assists),
          steals: Number(steals),
          blocks: Number(blocks),
          turnovers: Number(turnovers),
          fouls: Number(fouls),
          plusMinus: Number(plusMinus),
          points: Number(points),
        },
      };
    });
  });

  return { team1: joined[0], team2: joined[1] };
}

/**
 * Retrieves all players from the database.
 * @returns {Promise<QueryResult<Player>>} A promise that resolves to an array of players.
 */
export async function getAllPlayers_DB() {
  const data = await sql<Player>`
    SELECT * FROM players
  `;

  return data;
}

/**
 * Retrieves the player's regular season stats from their home page link.
 *
 * @param playerHomePageLink - The link to the player's home page.
 * @returns An object containing the player's first name, last name, team, and an array of their game stats.
 */
export async function getPlayerStatsFromEspnId(espnId: number): Promise<{
  firstName: string;
  lastName: string;
  teamName: string;
  espnId: number;
  playerGameStatsArr: PlayerGameStats[];
}> {
  async function getPlayerName(document: Document) {
    // should never be null right?
    const firstName = document.querySelector("h1.PlayerHeader__Name > span")!
      .textContent!;
    const lastName = document.querySelector(
      "h1.PlayerHeader__Name > span + span"
    )!.textContent!;
    return { firstName, lastName };
  }

  // noStore();

  let playerGameStatsArr = [];

  const pageLink = `https://www.espn.com/nba/player/gamelog/_/id/${espnId}`;

  const response = await fetch(pageLink);
  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const teamName = document.querySelector(
    ".PlayerHeader__Team_Info > li.truncate > a:nth-child(1)"
  )!.textContent!;

  const regularSeason = document.querySelector(".gamelog > div:nth-child(2)")!;
  if (regularSeason === null) {
    const { firstName, lastName } = await getPlayerName(document);
    return { firstName, lastName, espnId, teamName, playerGameStatsArr: [] };
  }

  // get all tables of games played
  const tables = regularSeason.querySelectorAll(".Table__TBODY");

  // for each table, get all rows and filter out rows that don't have stats
  // rows with class 'note-row' don't have stats
  for (let i = 0; i < tables.length; i++) {
    const rows = tables[i].querySelectorAll("tr.Table__TR");
    // for each row, get all columns and filter out rows that don't have stats
    for (let j = 0; j < rows.length; j++) {
      let row = rows[j];
      let classes = row.classList;
      if (
        classes.contains("note-row") ||
        classes.contains("totals_row") ||
        row.querySelector(".ResultCell") === null
      ) {
        continue;
      }

      // get stats from row
      let columns = row.querySelectorAll("td.Table__TD");

      let [
        date,
        opponentElement,
        resultElement,
        minutes,
        fieldGoals,
        fieldGoalPercentage,
        threePointers,
        threePointPercentage,
        freeThrows,
        freeThrowPercentage,
        rebounds,
        assists,
        blocks,
        steals,
        fouls,
        turnovers,
        points,
      ] = columns;

      let homeOrAway =
        opponentElement.querySelector("span > span")!.textContent;
      let isHome = homeOrAway == "vs" ? true : false;

      let [_, opponent] = opponentElement.querySelectorAll("a.AnchorLink");
      let [result, score] = resultElement.querySelectorAll(".ResultCell, span");

      let [fieldGoalsMade, fieldGoalsAttempted] = fieldGoals
        .textContent!.split("-")
        .map(Number);
      let [threePointersMade, threePointersAttempted] = threePointers
        .textContent!.split("-")
        .map(Number);
      let [freeThrowsMade, freeThrowsAttempted] = freeThrows
        .textContent!.split("-")
        .map(Number);

      let playerGameStats = {
        date: date.textContent!,
        opponentAcronym: opponent.textContent!,
        result: result.textContent!,
        score: score.textContent!,
        isHome,
        // properties above belong to each game rather than each player
        minutes: Number(minutes.textContent!),
        fieldGoalsMade,
        fieldGoalsAttempted,
        fieldGoalPercentage: Number(fieldGoalPercentage.textContent!),
        threePointersMade,
        threePointersAttempted,
        threePointPercentage: Number(threePointPercentage.textContent!),
        freeThrowsMade,
        freeThrowsAttempted,
        freeThrowPercentage: Number(freeThrowPercentage.textContent!),
        rebounds: Number(rebounds.textContent!),
        assists: Number(assists.textContent!),
        blocks: Number(blocks.textContent!),
        steals: Number(steals.textContent!),
        fouls: Number(fouls.textContent!),
        turnovers: Number(turnovers.textContent!),
        points: Number(points.textContent!),
      };

      playerGameStatsArr.push(playerGameStats);
    }
  }

  const { firstName, lastName } = await getPlayerName(document);

  return { firstName, lastName, espnId, teamName, playerGameStatsArr };
}
