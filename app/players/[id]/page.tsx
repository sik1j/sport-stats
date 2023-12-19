import { getPlayerStats } from "@/app/lib/actions";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const {
    firstName,
    lastName,
    playerGameStatsArr: stats,
  } = await getPlayerStats(`https://www.espn.com/nba/player/_/id/${id}`);

  const statKeys = Object.keys(stats[0]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>
        <span className="text-4xl font-bold">{firstName}</span>
        <span className="text-4xl"> {lastName}</span>
      </h1>
      <div>
        {stats.map((stat) => {
          return (
            <div key={stat.date}>
              {statKeys.map((key) => 
                <span className="mr-4" key={key}>
                    {key}
                </span>
              )}
              {Object.entries(stat).map(([key, value]) => (
                <span className="mr-4" key={key}>
                  {value}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </main>
  );
}
