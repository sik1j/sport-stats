// Takes date string in from 'MM/DD' and converts it to Date obj
function convertMMDDtoDate(date) {
  const splitVals = date.split("/");
  const month = Number(splitVals[0]) - 1;
  const day = Number(splitVals[1]);

  let year;
  if ([9, 10, 11].find((elem) => elem == month)) {
    year = 2023;
  } else {
    year = 2024;
  }

  return new Date(year, month, day);
}

/**
 * Takes a team acronym and returns the full team name
 * @param {string} teamAcronym
 * @returns {string} teamName
 */
function getTeamNameFromAcronym(teamAcronym) {
  switch (teamAcronym) {
    case "ATL":
      return "Atlanta Hawks";
    case "BOS":
      return "Boston Celtics";
    case "BKN":
      return "Brooklyn Nets";
    case "CHA":
      return "Charlotte Hornets";
    case "CHI":
      return "Chicago Bulls";
    case "CLE":
      return "Cleveland Cavaliers";
    case "DAL":
      return "Dallas Mavericks";
    case "DEN":
      return "Denver Nuggets";
    case "DET":
      return "Detroit Pistons";
    case "GS":
      return "Golden State Warriors";
    case "HOU":
      return "Houston Rockets";
    case "IND":
      return "Indiana Pacers";
    case "LAC":
      return "LA Clippers";
    case "LAL":
      return "Los Angeles Lakers";
    case "MEM":
      return "Memphis Grizzlies";
    case "MIA":
      return "Miami Heat";
    case "MIL":
      return "Milwaukee Bucks";
    case "MIN":
      return "Minnesota Timberwolves";
    case "NO":
      return "New Orleans Pelicans";
    case "NY":
      return "New York Knicks";
    case "OKC":
      return "Oklahoma City Thunder";
    case "ORL":
      return "Orlando Magic";
    case "PHI":
      return "Philadelphia 76ers";
    case "PHX":
      return "Phoenix Suns";
    case "POR":
      return "Portland Trail Blazers";
    case "SA":
      return "San Antonio Spurs";
    case "SAC":
      return "Sacramento Kings";
    case "TOR":
      return "Toronto Raptors";
    case "UTAH":
      return "Utah Jazz";
    case "WSH":
      return "Washington Wizards";
    default:
      return "Invalid team acronym";
  }
}

module.exports = {
  convertMMDDtoDate,
  getTeamNameFromAcronym,
};
