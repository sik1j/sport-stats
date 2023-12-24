const { db } = require("@vercel/postgres");
const {
  getAllTeams,
  getAllPlayerLinksFromTeam,
  getPlayerName,
  getEspnIdFromLink,
  getAllTeamObjects
} = require("./actions.js");

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
