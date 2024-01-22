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

/**
 * Retrieves game data from ESPN based on the provided game ID.
 * @param espnGameId - The ESPN game ID.
 * @returns An object containing the game data, including the date, scores, and team names.
 */
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
    document.querySelector(
      "div.Gamestrip__Team:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)"
    )!.textContent!
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
    .filter((game, ind) => {
      const gameColumns = game.querySelectorAll("td.Table__TD");
      return gameColumns.length === 7 && gameColumns[0].textContent !== "DATE";
    })
    .map((game) =>
      game
        .querySelector("td:nth-child(3) > span:nth-child(2) > a:nth-child(1)")
        ?.getAttribute("href")
    );

  return regularSeasonGameLinks;
}

/**
 * Retrieves player stats of all players in a game from given ESPN game ID.
 * @param espnGameId The ESPN game ID.
 * @returns An array of player stats. stats === null if the player did not play.
 */
export async function getPlayerStatsFromEspnGameId(espnGameId: number) {
  const getPlayerNames = (teamPlayerTable: NodeListOf<Element>) => {
    return Array.from(teamPlayerTable).map((player) => {
      const link = player.getAttribute("href");

      let espnId;
      let lowerCaseName;
      if (link === null) {
        espnId = null;
        lowerCaseName = null;
      } else {
        espnId = parseInt(link.split("/")[7]);
        lowerCaseName = link.split("/")[8].replaceAll("-", " ");
      }

      return { lowerCaseName, espnId };
    });
  };

  const getPlayerStats = (teamStatTable: NodeListOf<Element>) => {
    return Array.from(teamStatTable)
      .map((player) => {
        const columns = player.querySelectorAll("td");

        if (columns[0]?.textContent === "MIN" || columns[0]?.textContent === '') return null;
        if (columns.length === 1) return 'DNP';

        const [
          min,
          fieldGoals,
          threePointers,
          freeThrows,
          _,
          __,
          rebounds,
          assists,
          steals,
          blocks,
          turnovers,
          fouls,
          plusMinus,
          points,
        ] = Array.from(columns).map((td) => td.textContent);

        const extractMadeAndAttempted = (shotStat: string | null) => {
          if (shotStat === null) return [null, null];
          return shotStat.split("-").map((num) => parseInt(num));
        }

        const [fieldGoalsMade, fieldGoalsAttempted] = extractMadeAndAttempted(fieldGoals);
        const [threePointersMade, threePointersAttempted] = extractMadeAndAttempted(threePointers);
        const [freeThrowsMade, freeThrowsAttempted] = extractMadeAndAttempted(freeThrows);

        return {
          min: min === null ? null : parseInt(min),
          fieldGoalsMade,
          fieldGoalsAttempted,
          threePointersMade,
          threePointersAttempted,
          freeThrowsMade,
          freeThrowsAttempted,
          rebounds: rebounds === null ? null : parseInt(rebounds),
          assists: assists === null ? null : parseInt(assists),
          steals: steals === null ? null : parseInt(steals),
          blocks: blocks === null ? null : parseInt(blocks),
          turnovers: turnovers === null ? null : parseInt(turnovers),
          fouls: fouls === null ? null : parseInt(fouls),
          plusMinus: plusMinus === null ? null : parseInt(plusMinus),
          points: points === null ? null : parseInt(points),
        };
      })
      .filter((player) => player !== null);
  };

  const statPageLink = `https://www.espn.com/nba/boxscore/_/gameId/${espnGameId}`;

  const response = await fetch(statPageLink);
  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const team1PlayerTable = document.querySelectorAll(
    ".Boxscore__ResponsiveWrapper > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(3) > tr > td:nth-child(1) > div:nth-child(1) > a:nth-child(1)"
  );
  const team2PlayerTable = document.querySelectorAll(
    ".Boxscore__ResponsiveWrapper > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(3) > tr > td:nth-child(1) > div:nth-child(1) > a:nth-child(1)"
  );

  const team1StatTable = document.querySelectorAll(
    ".Boxscore__ResponsiveWrapper > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(3) > tr"
  );
  const team2StatTable = document.querySelectorAll(
    ".Boxscore__ResponsiveWrapper > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(3) > tr"
  );

  const team1PlayerNames = getPlayerNames(team1PlayerTable);
  const team1Stats = getPlayerStats(team1StatTable);
  
  const team2PlayerNames = getPlayerNames(team2PlayerTable);
  const team2Stats = getPlayerStats(team2StatTable);

  return {
    team1: team1Stats.map((stats, ind) => {
      if (stats === 'DNP') return {...team1PlayerNames[ind], ...{stats: null}};
      return {...team1PlayerNames[ind], stats};
    }),
    team2: team2Stats.map((stats, ind) => {
      if (stats === 'DNP') return {...team2PlayerNames[ind], ...{stats: null}};
      return {...team2PlayerNames[ind], stats};
    })
  };
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

export async function getAllTeams_DB() {
  const data = await sql<Team>`
    SELECT * FROM teams
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
