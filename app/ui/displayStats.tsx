import { getPlayerStats } from "../lib/actions";

export default async function DisplayStats({ id }: { id: string }) {
  const {
    firstName,
    lastName,
    playerGameStatsArr: stats,
  } = await getPlayerStats(`https://www.espn.com/nba/player/_/id/${id}`);

  if (stats.length === 0) {
    return (
        <p>No stats available</p>
    );
  }

  const tableHeaders = [
    "DATE",
    "OPP",
    "RESULT",
    "SCORE",
    "MIN",
    "FGM",
    "FGA",
    "FG%",
    "3PTM",
    "3PTA",
    "3PT%",
    "FTM",
    "FTA",
    "FT%",
    "REB",
    "AST",
    "BLK",
    "STL",
    "PF",
    "TO",
    "PTS",
  ];

  return (
    <div>
      <table className="border-white border-2">
        <thead>
          <tr>
            {tableHeaders.map((key) => (
              <th className="p-3 border-2 border-white border-collapse" key={key}>
                {key}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {stats.map((stat) => {
            return (
              <tr key={stat.date} className="even:bg-slate-900">
                {Object.entries(stat).map(([key, value]) => (
                  <td className="p-3 border-2 border-white border-collapse" key={key}>
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
