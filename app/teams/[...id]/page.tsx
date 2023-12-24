import {
  getPlayerName,
  getPlayersFromTeamNameSlug,
} from "@/app/lib/actions";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string[] } }) {
  function getPlayerLink(playerEspnId: string) {
    return `https://www.espn.com/nba/player/_/id/${playerEspnId}`;
  }

  const teamNameSlug = params.id.join("/");
  const playerObjs = await getPlayersFromTeamNameSlug(teamNameSlug);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Players</h1>
      <ul>
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
