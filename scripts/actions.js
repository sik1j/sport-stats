const { JSDOM } = require("jsdom");
const { sql } = require("@vercel/postgres");
const { convertMMDDtoDate } = require("./utility");

async function getGameFromGameData_DB(date, playerTeamId, opponentTeamName, isPlayerTeamHome) {
  // date is in format "DAY MM/DD"
  // MM in [9,11] is in 2023, else 2024
  const gameDate = convertMMDDtoDate(date.split(' ')[1]);

  const gameDateString = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, '0')}-${String(gameDate.getDate()).padStart(2, '0')}`;

  let data;

  if (isPlayerTeamHome) {
    data = await sql`
      SELECT games.id, games.date, home_team.name AS home_team_name, away_team.name AS away_team_name 
      FROM games
      JOIN teams AS home_team ON home_team.id = games.home_team_id
      JOIN teams AS away_team ON away_team.id = games.away_team_id
      WHERE games.date = ${gameDateString}
      AND home_team.id =  ${playerTeamId}
      AND away_team.name = ${opponentTeamName}
    `;
  } else {
    data = await sql`
      SELECT games.id, games.date, home_team.name AS home_team_name, away_team.name AS away_team_name 
      FROM games
      JOIN teams AS home_team ON home_team.id = games.home_team_id
      JOIN teams AS away_team ON away_team.id = games.away_team_id
      WHERE games.date = ${gameDateString}
      AND away_team.id =  ${playerTeamId}
      AND home_team.name = ${opponentTeamName}
    `;
  }

  return data;
}

async function getAllGamesOnDate(date) {
  const year = date.getFullYear();
  // month+1 because months are 0 indexed
  const month = (date.getMonth()+1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const response = await fetch(
    `https://www.espn.com/nba/schedule/_/date/${year}${month}${day}`
  );
  // console.log(`https://www.espn.com/nba/schedule/_/date/${year}${month}${day}`);
  // console.log(year, month, day);

  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const gamesSection = document.querySelector("div.event-schedule__season + div.mt3");
  const firstSection = gamesSection.children[0];

  const title = firstSection.querySelector('div.Table__Title');
  // console.log(title.textContent);

  if (firstSection.classList.contains('EmptyTable')) {
    return [];
  }

  const table = document.querySelector('div.ResponsiveTable > div.flex > div.Table__ScrollerWrapper > div.Table__Scroller > table.Table > tbody');
  const rows = Array.from(table.querySelectorAll('tr.Table__TR'));

  return rows.map(row => {
    const awayTeamCity = row.querySelector('span.Table__Team.away').textContent;
    const homeTeamCity = row.querySelector('span.at + span.Table__Team').textContent;
    return { awayTeamCity, homeTeamCity };
  });

}

function getEspnIdFromLink(link) {
  return link.split("/")[7];
}

async function getAllPlayers_DB() {
  const data = await sql`
    SELECT * FROM players
  `;  

  return data;
}

async function getAllTeamObjects() {
  const response = await fetch("https://www.espn.com/nba/teams");
  const html = await response.text();
  const dom = new JSDOM(html);

  const document = dom.window.document;

  const teams = Array.from(
    document.querySelectorAll("section.TeamLinks.flex.items-center > div.pl3 > a.AnchorLink")
  );

  let teamLinks = [];
  for (let team of teams) {
    const relativeLink = team.getAttribute("href");
    const name = team.textContent;
    teamLinks.push({relativeLink, name});
  }

  return teamLinks;

}

async function getAllTeams() {
  const data = await sql`
  SELECT * FROM teams
  ORDER BY name ASC
  `;
  return data.rows;
}

async function getAllPlayers() {
  try {
    let playersPerTeam = [];

    const teams = await getAllTeams();

    for (let team of teams) {
      const teamLink = team.link;
      const teamName = team.name;
      const teamPlayers = await getAllPlayerLinksFromTeam(teamLink);
      playersPerTeam.push({ teamName, teamPlayers });
    }

    return playersPerTeam;

    // console.log(playersPerTeam);
  } catch (error) {
    console.error(error);
    throw new Error("Error getting all players");
  }
}

// Takes team link FROM TEAMS TABLE and returns array of player links
async function getAllPlayerLinksFromTeam(teamLink) {
  teamLink = teamLink.replace("team", "team/roster");
  const response = await fetch(teamLink);
  const html = await response.text();
  const dom = new JSDOM(html);

  const document = dom.window.document;

  const players = Array.from(
    document.querySelectorAll("tbody.Table__TBODY tr.Table__TR a.AnchorLink")
  );
  let playerLinks = [];
  for (let player of players) {
    const playerLink = player.getAttribute("href");
    playerLinks.push(playerLink);
  }

  playerLinks = playerLinks.filter(
    (link, index, self) => self.indexOf(link) === index
  );

  return playerLinks;
}

async function getPlayerName(playerPageLink) {
  const response = await fetch(playerPageLink);
  const html = await response.text();
  const dom = new JSDOM(html);

  const document = dom.window.document;

  const firstName = document.querySelector("h1.PlayerHeader__Name > span")
    .textContent;
  const lastName = document.querySelector(
    "h1.PlayerHeader__Name > span + span"
  ).textContent;

  return { firstName, lastName };
}

async function getPlayerStats(playerPageLink) {
  try {
  function getPlayerName(document) {
    // should never be null right?
    const firstName = document.querySelector("h1.PlayerHeader__Name > span")
      .textContent;
    const lastName = document.querySelector(
      "h1.PlayerHeader__Name > span + span"
    ).textContent;
    return { firstName, lastName };
  }

  let playerGameStatsArr = [];

  let pageLink = playerPageLink.replace("player", "player/gamelog");

  const response = await fetch(pageLink);
  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  // get all tables of games played
  const tables = document.querySelectorAll(".Table__TBODY");

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

      let homeOrAway = opponentElement.querySelector("span > span").textContent;
      let isHome = homeOrAway == 'vs' ? true : false;

      let [_, opponent] = opponentElement.querySelectorAll("a.AnchorLink");
      let [result, score] = resultElement.querySelectorAll(".ResultCell, span");

      let [fieldGoalsMade, fieldGoalsAttempted] = fieldGoals
        .textContent.split("-")
        .map(Number);
      let [threePointersMade, threePointersAttempted] = threePointers
        .textContent.split("-")
        .map(Number);
      let [freeThrowsMade, freeThrowsAttempted] = freeThrows
        .textContent.split("-")
        .map(Number);

      let playerGameStats = {
        date: date.textContent,
        opponent: opponent.textContent,
        result: result.textContent,
        score: score.textContent,
        isHome,
        // properties above belong to each game rather than each player
        minutes: Number(minutes.textContent),
        fieldGoalsMade,
        fieldGoalsAttempted,
        fieldGoalPercentage: Number(fieldGoalPercentage.textContent),
        threePointersMade,
        threePointersAttempted,
        threePointPercentage: Number(threePointPercentage.textContent),
        freeThrowsMade,
        freeThrowsAttempted,
        freeThrowPercentage: Number(freeThrowPercentage.textContent),
        rebounds: Number(rebounds.textContent),
        assists: Number(assists.textContent),
        blocks: Number(blocks.textContent),
        steals: Number(steals.textContent),
        fouls: Number(fouls.textContent),
        turnovers: Number(turnovers.textContent),
        points: Number(points.textContent),
      };

      playerGameStatsArr.push(playerGameStats);
    }
  }

  const { firstName, lastName } = await getPlayerName(document);
  const team = document
    .querySelector(
      "div.PlayerHeader__Team.n8.mt3.mb4.flex.items-center.clr-gray-01"
    )
    .textContent.split("#")[0];
  return { firstName, lastName, team, playerGameStatsArr };
    }
    catch (error) {
      console.error(error);
      throw new Error(`Error getting player stats for ${playerPageLink}`);
    }
}

module.exports = {
  getAllTeams,
  getAllPlayers,
  getAllPlayerLinksFromTeam,
  getPlayerName,
  getPlayerStats,
  getEspnIdFromLink,
  getAllTeamObjects,
  getAllGamesOnDate,
  getAllPlayers_DB,
  getPlayerStats,
  getGameFromGameData_DB,
};