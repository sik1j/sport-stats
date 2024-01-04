import { VercelPoolClient } from "@vercel/postgres";
import {
  getPlayerStatsFromEspnId,
  getAllPlayers_DB,
  PlayerGameStats,
} from "./actionsts";
import { Player, Game } from "./definitions";
import { convertMMDDtoDate } from "./utilityts";
import { db } from "@vercel/postgres";

async function seedPlayerStats(client: VercelPoolClient) {
  try {
    console.log("Fetching all players from the database...");
    const allPayers = await getAllPlayers_DB();
    console.log(`fetched ${allPayers.rows.length} players`);

    console.log("Fetching player stats from ESPN...");
    const statsOfAllPlayers = await Promise.all(
      allPayers.rows.map(async (player) => {
        try {
          const stats = await getPlayerStatsFromEspnId(player.espn_id);
          console.log(`fetched stats of ${stats.firstName}`);
          return stats;
        } catch (e) {
          console.log(`Error: ${e}, ${player.name}`);
        }
      })
    );
    console.log(`fetched stats of ${statsOfAllPlayers.length} players`);

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

    console.log("created table player_stats");

    const allStatsInserted = await Promise.all(
      statsOfAllPlayers
        .filter(
          (
            stats
          ): stats is {
            firstName: string;
            lastName: string;
            teamName: string;
            espnId: number;
            playerGameStatsArr: PlayerGameStats[];
          } => stats != undefined
        )
        .map(async (playerStats) => {
          console.log(`inserting stats of ${playerStats.firstName}`);

          const player = await client.sql<Player>`
          SELECT * FROM players WHERE name = ${
            playerStats.firstName + " " + playerStats.lastName
          }
        `;
          if (player.rows.length == 0) {
            throw new Error(
              `Player ${playerStats.firstName} ${playerStats.lastName} not found`
            );
          }
          const playerId = player.rows[0].id;

          const statsInserted = await Promise.all(
            playerStats.playerGameStatsArr.map(async (stat) => {
              const gameDate = convertMMDDtoDate(stat.date.split(" ")[1]);
              const game = await client.sql<Game>`
                    SELECT
                        games.id,
                        games.date,
                        home_team.name AS home_team_name,
                        away_team.name AS away_team_name
                    FROM
                        games
                    JOIN
                        teams AS home_team ON games.home_team_id = home_team.id
                    JOIN
                        teams AS away_team ON games.away_team_id = away_team.id
                    WHERE games.date = ${gameDate.toISOString()} 
                    AND (home_team.name = ${
                      playerStats.teamName
                    } OR away_team.name = ${playerStats.teamName})
                `;
              if (game.rows.length == 0) {
                console.log(
                  `Game of ${playerStats.firstName} ${playerStats.lastName} at stat ${stat.date} not found`
                );
                return;
              }
              const gameId = game.rows[0].id;

              const insertStat = await client.sql`
                    INSERT INTO player_stats (
                        player_id,
                        game_id,
                        minutes,
                        points,
                        assists,
                        rebounds,
                        blocks,
                        steals,
                        turnovers,
                        fouls,
                        field_goals_made,
                        field_goals_attempted,
                        field_goal_percentage,
                        three_pointers_made,
                        three_pointers_attempted,
                        three_point_percentage,
                        free_throws_made,
                        free_throws_attempted,
                        free_throw_percentage
                    ) VALUES (
                        ${playerId},
                        ${gameId},
                        ${stat.minutes},
                        ${stat.points},
                        ${stat.assists},
                        ${stat.rebounds},
                        ${stat.blocks},
                        ${stat.steals},
                        ${stat.turnovers},
                        ${stat.fouls},
                        ${stat.fieldGoalsMade},
                        ${stat.fieldGoalsAttempted},
                        ${stat.fieldGoalPercentage},
                        ${stat.threePointersMade},
                        ${stat.threePointersAttempted},
                        ${stat.threePointPercentage},
                        ${stat.freeThrowsMade},
                        ${stat.freeThrowsAttempted},
                        ${stat.freeThrowPercentage}
                    )
                `;
              return insertStat;
            })
          );
        })
    );
  } catch (error) {
    console.error(error);
    throw new Error("Error seeding player stats");
  }
}

async function main() {
  const client = await db.connect();
  await seedPlayerStats(client);
}

main().catch((error) => {
  console.error(error);
});
