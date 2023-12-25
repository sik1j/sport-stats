import { getAllTeams } from "@/app/lib/actions";
import { getTeamIdentifierFromTeamLink } from "@/app/lib/utility";
import Link from "next/link";
import { Team } from "../lib/definitions";
import { performance } from "perf_hooks";

export default async function Teams() {
  const start = performance.now();

  const teams = await getAllTeams();

  const end = performance.now();

  console.log(`Took ${end - start} milliseconds to get all teams.`)

  return (
    <div>
      <h1>Teams</h1>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            <Link href={`/teams/${getTeamIdentifierFromTeamLink(team.link)}`}>{team.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
