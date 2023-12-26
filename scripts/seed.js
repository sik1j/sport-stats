const { db } = require("@vercel/postgres");
const {
  getAllTeams,
  getAllPlayerLinksFromTeam,
  getPlayerName,
  getEspnIdFromLink,
  getAllTeamObjects,
  getAllGamesOnDate,
  getAllPlayers_DB,
  getPlayerStats
} = require("./actions.js");

async function seedGames(client) {

  function getTeamCity(teamName) {
    if (teamName === "Portland Trail Blazers") return "Portland";
    const words = teamName.split(" ");
    return words.slice(0, words.length - 1).join(" ");
  }

  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    const createGamesTable = await client.sql`
      CREATE TABLE IF NOT EXISTS games (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        date DATE NOT NULL,
        home_team_id UUID REFERENCES teams(id),
        away_team_id UUID REFERENCES teams(id)
      );
    `;

    console.log("Created table `games`");

    // NBA regular non-preseason season starts Oct 24, 2023 till Apr 6, 2024

    // Jan -> 0, Feb -> 1, Mar -> 2, Apr -> 3, ... Oct -> 9, Nov -> 10, Dec -> 11
    const teams = await getAllTeams();

    const startDate = new Date(2023, 9, 24);
    const endDate = new Date(2024, 3, 14);

    const allDates = [];
    while (startDate <= endDate) {
      allDates.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    const insertGames = await Promise.all(
      allDates.map(async (date) => {
        const games = await getAllGamesOnDate(date);

        console.log(`Inserting ${games.length} games for ${date.toDateString()}`);

        return Promise.all(
          games.map(async (game) => {
            const homeTeam = teams.find(
              (team) => getTeamCity(team.name) === game.homeTeamCity
            );
            const awayTeam = teams.find(
              (team) => getTeamCity(team.name) === game.awayTeamCity
            );

            return client.sql`
              INSERT INTO games (date, home_team_id, away_team_id)
              VALUES (${date}, ${homeTeam.id}, ${awayTeam.id})
            `;
          })
        );
      })
    );

    const totalGames = insertGames.reduce((acc, curr) => acc + curr.length, 0);

    console.log(`Inserted ${insertGames.flat().length} | ${totalGames}  games into table`);

    return {
      createGamesTable,
      insertGames
    }

  } catch (error) {
    console.error("Error seeding games table:", error);
    throw error;
  }
}

async function seedPlayers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // create table `players` if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS players (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team_id UUID REFERENCES teams(id),
        espn_id INT NOT NULL
      );
    `;

    console.log("Created table `players`");

    const allTeams = await getAllTeams();

    const insertAllPlayers = await Promise.all(
      allTeams.map(async (team) => {
        console.log(`Inserting players for ${team.name}`);
        const playerLinks = await getAllPlayerLinksFromTeam(team.link);

        const insertPlayers = await Promise.all(
          playerLinks.map(async (playerLink) => {
            const { firstName, lastName } = await getPlayerName(playerLink);
            const espnId = getEspnIdFromLink(playerLink);

            return client.sql`
            INSERT INTO players (name, team_id, espn_id)
            VALUES (${firstName + " " + lastName}, ${team.id}, ${espnId})
          `;
          })
        );

        console.log(`Inserted ${insertPlayers.length} players for ${team.name}`);
        return insertPlayers;
      }
      )
    );

    // both playersInserted and allPlayers are counts of players inserted
    const playersInserted = insertAllPlayers.reduce(
      (acc, curr) => acc + curr.length,
      0
    );
    const allPlayers = insertAllPlayers.flat();

    console.log(`Inserted ${playersInserted} | ${allPlayers.length} players into table`);

    return {
      createTable,
      allPlayers
    };
  } catch (error) {
    console.error("Error seeding players table:", error);
    throw error;
  }
}

async function seedTeams(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // create table `teams` if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        link TEXT NOT NULL
      );
    `;

    console.log("Created table `teams`");

    const teamLinks = await getAllTeamObjects();

    // insert all teams into the table
    const insertTeams = await Promise.all(
      teamLinks.map(
        (team) =>
          client.sql`
          INSERT INTO teams (name, link)
          VALUES (${team.name}, ${'https://www.espn.com' + team.relativeLink})
        `
      )
    );

    console.log(`Inserted ${insertTeams.length} teams into table`);

    return {
      createTable,
      teams: insertTeams,
    };
  } catch (error) {
    console.error("Error seeding teams table:", error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  // await seedTeams(client);

  // await seedPlayers(client);

  await client.end();
}

main().catch((error) => {
  console.error("An error occurred while seeding:", error);
});
