import {
  getPlayerName,
  getPlayersFromTeamNameSlug,
  getAllTeams
} from "@/app/lib/actions";
import { getTeamIdentifierFromTeamLink } from "@/app/lib/utility";
import Link from "next/link";
import { performance } from "perf_hooks";

export async function generateStaticParams() {
  const teams = await getAllTeams();

  return teams.map((team) => ({
    id: getTeamIdentifierFromTeamLink(team.link).split("/"),
  }));
}

export default async function Page({ params }: { params: { id: string[] } }) {
  function getPlayerLink(playerEspnId: string) {
    return `https://www.espn.com/nba/player/_/id/${playerEspnId}`;
  }

  const teamNameSlug = params.id.join("/");

  const start = performance.now();
  const playerObjs = await getPlayersFromTeamNameSlug(teamNameSlug);
  const end = performance.now();
  console.log(`getPlayersFromTeamNameSlug took ${end - start} milliseconds.`)

  // console.log(playerObjs.map((playerObj) => playerObj.name));

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Players</h1>
      <ul>
        {/* Players list goes here. */}
        {playerObjs.map(async (playerObj) => {
          const playerLink = getPlayerLink(playerObj.espn_id);
          const { firstName, lastName } = await getPlayerName(playerLink);

          return (
            <li key={playerLink}>
              <Link
                href={`/players/${playerObj.espn_id}`}
              >{`${firstName} ${lastName}`}</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
