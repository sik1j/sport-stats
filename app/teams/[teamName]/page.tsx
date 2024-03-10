import { getTeams, getTeamPlayers } from "@/app/lib/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default async function Team({
  params,
}: {
  params: { teamName: string };
}) {
  const players = await getTeamPlayers(params.teamName);
  return (
    <div>
      <h1>{params.teamName}</h1>
      <h2>Players:</h2>
      {players.map((player) => (
        <div key={player.id}>
          <Link
            href={`${params.teamName}/${player.firstName}-${player.familyName}/${player.id}`}
          >{`${player.firstName[0].toUpperCase()}. ${player.familyName}`}</Link>
        </div>
      ))}
    </div>
  );
}

export async function generateStaticParams() {
  const teams = await getTeams();

  return teams.map((team) => ({
    teamName: team.teamName,
  }));
}
