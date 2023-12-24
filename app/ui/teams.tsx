import { getAllTeams } from "@/app/lib/actions";
import Link from "next/link";
import { Team } from "../lib/definitions";
import { performance } from "perf_hooks";

export default async function Teams() {
  const start = performance.now();

  const teams = await getAllTeams();

  const end = performance.now();

  console.log(`Teams took ${end - start} milliseconds to load`)

  function getTeamIdentifier(team: Team) {
    return team.link.split("/").slice(7,9).join('/');
  }

  return (
    <div>
      <h1>Teams</h1>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            <Link href={`/teams/${getTeamIdentifier(team)}`}>{team.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
