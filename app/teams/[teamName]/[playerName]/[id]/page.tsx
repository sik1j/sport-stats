import { getAllPlayers, getPlayerStats } from "@/app/lib/actions";
import Link from "next/link";

export default async function Player({
  params,
}: {
  params: { playerName: string; id: string };
}) {
  const stats = await getPlayerStats(Number(params.id));

  return (
    <div>
      <h1>{params.playerName}</h1>
      <h2>Stats:</h2>
      {/* {stats.map((stat) => (
        <div key={stat.id}>
          <div className="flex gap-4">
            <div>{`GameId: ${stat.gameId}`}</div>
            <div>{`Points: ${stat.points}`}</div>
            <div>{`Assists: ${stat.assists}`}</div>
          </div>
        </div>
      ))} */}
      <table className="border-spacing-4">
        <thead>
          <tr>
            <th>Game ID</th>
            <th>Points</th>
            <th>Assists</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.gameId}>
              <td>{stat.gameId}</td>
              <td>{stat.points}</td>
              <td>{stat.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function generateStaticParams() {
  const players = await getAllPlayers();

  return players.map((player) => ({
    playerName: `${player.firstName}-${player.familyName}`,
    id: `${player.id}`,
  }));
}
