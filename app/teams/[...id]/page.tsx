import { getAllPlayerLinksFromTeam, getPlayerName } from "@/app/lib/actions";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string[] } }) {
  function getPlayerESPNid(playerLink: string) {
    return playerLink.split("/")[7];
  }

  const id = params.id;
  const playerLinks = await getAllPlayerLinksFromTeam(
    `https://www.espn.com/nba/team/roster/_/name/${id.join("/")}`
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Players</h1>
      <ul>
        {playerLinks.map(async (playerLink) => {
          const { firstName, lastName } = await getPlayerName(playerLink);
          const id = getPlayerESPNid(playerLink);
          return (
            <li key={playerLink}>
              <Link href={`/players/${id}`}>{`${firstName} ${lastName}`}</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
