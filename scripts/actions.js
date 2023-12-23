const { JSDOM } = require("jsdom");
const { sql } = require("@vercel/postgres");

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

async function getAllPlayerLinksFromTeam(teamLink) {
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
  async function getPlayerName(document) {
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

module.exports = {
  getAllTeams,
  getAllPlayers,
  getAllPlayerLinksFromTeam,
  getPlayerName,
  getPlayerStats,
};