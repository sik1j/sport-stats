const { db } = require("@vercel/postgres");
const { teamLinks } = require("./teamLinks.js");

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
          VALUES (${team.name}, ${'https://www.espn.com' + team.link})
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

  await seedTeams(client);

  // await seedPlayers(client);

  await client.end();
}

main().catch((error) => {
  console.error("An error occurred while seeding:", error);
});
