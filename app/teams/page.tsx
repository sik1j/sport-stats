import { getTeams } from "@/app/lib/actions";
import Link from "next/link";

export default async function Teams() {
  const teams = await getTeams();
  return (
    <div>
      <h1>Teams:</h1>
      <div className="flex flex-col">
        {teams.map((team) => (
          <Link href={`teams/${team.teamName}`} key={`${team.teamName}`}>
            {team.teamName}
          </Link>
        ))}
      </div>
    </div>
  );
}
