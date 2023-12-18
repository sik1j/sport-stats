const { db } = require("@vercel/postgres");
const { teamLinks } = require("./teamLinks");

async function seedTeams(client) {
  try {
    // create table `teams` if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        link TEXT NOT NULL,
      );
    `;

    console.log("Created table `teams`");

    // insert all teams into the table
    const insertTeams = await Promise.all(
      teamLinks.map(
        (team) =>
          client.sql`
          INSERT INTO teams (name, link)
          VALUES (${team.name}, ${team.link})
        `
      )
    );
  } catch (error) {
    console.error("Error seeding teams table:", error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await seedTeams(client);

  await client.end();
}

main().catch((error) => {
  console.error("An error occurred while seeding:", error);
});
