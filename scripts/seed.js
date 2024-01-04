const { db } = require("@vercel/postgres");
const {
  getAllTeams,
  getAllPlayerLinksFromTeam,
  getPlayerName,
  getEspnIdFromLink,
  getAllTeamObjects,
  getAllGamesOnDate,
  getAllPlayers_DB,
  getPlayerStats,
  getGameFromGameData_DB,
} = require("./actions.js");
const { convertMMDDtoDate, getTeamNameFromAcronym } = require("./utility.js");

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

async function seedPlayerStats(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS player_stats (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        player_id UUID REFERENCES players(id),
        game_id UUID REFERENCES games(id),
        minutes INT NOT NULL,
        points INT NOT NULL,
        assists INT NOT NULL,
        rebounds INT NOT NULL,
        blocks INT NOT NULL,
        steals INT NOT NULL,
        turnovers INT NOT NULL,
        fouls INT NOT NULL,
        field_goals_made INT NOT NULL,
        field_goals_attempted INT NOT NULL,
        field_goal_percentage DECIMAL,
        three_pointers_made INT NOT NULL,
        three_pointers_attempted INT NOT NULL,
        three_point_percentage DECIMAL,
        free_throws_made INT NOT NULL,
        free_throws_attempted INT NOT NULL,
        free_throw_percentage DECIMAL
      );
    `;

    console.log("Created table `player_stats`");
    
    const allPlayers = await getAllPlayers_DB();      

    const insertAllPlayerStats = await Promise.all(
      allPlayers.rows.map(async (player) => {
        console.log(`Inserting player stats for ${player.name}`);
        const playerStats = await getPlayerStats(`https://www.espn.com/nba/player/_/id/${player.espn_id}`);
        return Promise.all(
          playerStats.playerGameStatsArr
          // Keep regular season games. Note: gameStats.date is in format 'Thu 10/24'
          .filter(gameStats => convertMMDDtoDate(gameStats.date.split(' ')[1]) >= new Date(2023, 9, 24))
          // insert regular season stats into table
          .map(async (gameStats) => {
            const game = await getGameFromGameData_DB(gameStats.date, player.team_id, getTeamNameFromAcronym(gameStats.opponent), gameStats.isHome);
            if (game.rows.length === 0) {
              console.log(gameStats.date, player.team_id, getTeamNameFromAcronym(gameStats.opponent), gameStats.isHome);
              console.log(game.rows);
              throw new Error('Game not found');
            }
            // const gameId = game.rows[0].id;
            // return client.sql`
            //   INSERT INTO player_stats (player_id, game_id, minutes, points, assists, rebounds, blocks, steals, turnovers, fouls, field_goals_made, field_goals_attempted, field_goal_percentage, three_pointers_made, three_pointers_attempted, three_point_percentage, free_throws_made, free_throws_attempted, free_throw_percentage)
            //   VALUES (${player.id}, ${gameId}, ${gameStats.minutes}, ${gameStats.points}, ${gameStats.assists}, ${gameStats.rebounds}, ${gameStats.blocks}, ${gameStats.steals}, ${gameStats.turnovers}, ${gameStats.fouls}, ${gameStats.fieldGoalsMade}, ${gameStats.fieldGoalsAttempted}, ${gameStats.fieldGoalPercentage}, ${gameStats.threePointersMade}, ${gameStats.threePointersAttempted}, ${gameStats.threePointPercentage}, ${gameStats.freeThrowsMade}, ${gameStats.freeThrowsAttempted}, ${gameStats.freeThrowPercentage})
            // `;
          })
        );
      })
    );

  } catch (error) {
    console.error("Error seeding player_stats table:", error);
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

  // await seedGames(client);

  // await seedPlayerStats(client);
  console.log(await getPlayerStats('https://www.espn.com/nba/player/_/id/4684806'));

  // const games = await getGameFromGameData_DB('Thu 10/24');
  // console.log(games.rows);
  // await getGameIdFromGameData_DB('Sum 1/3');

  await client.end();
}

main().catch((error) => {
  console.error("An error occurred while seeding:", error);
});
