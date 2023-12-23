import { getPlayerName } from "@/app/lib/actions";
import DisplayStats from "@/app/ui/displayStats";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const { firstName, lastName } = await getPlayerName(
    `https://www.espn.com/nba/player/_/id/${id}`
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>
        <span className="text-4xl font-bold">{firstName}</span>
        <span className="text-4xl"> {lastName}</span>
      </h1>
      <DisplayStats id={id} />
    </main>
  );
}
