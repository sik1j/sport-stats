export interface Root {
  meta: Meta;
  leagueSchedule: LeagueSchedule;
}

export interface Meta {
  version: number;
  request: string;
  time: string;
}

export interface LeagueSchedule {
  seasonYear: string;
  leagueId: string;
  gameDates: GameDate[];
  weeks: Week[];
  broadcasterList: BroadcasterList[];
}

export interface GameDate {
  gameDate: string;
  games: Game[];
}

export interface Game {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameSequence: number;
  gameDateEst: string;
  gameTimeEst: string;
  gameDateTimeEst: string;
  gameDateUTC: string;
  gameTimeUTC: string;
  gameDateTimeUTC: string;
  awayTeamTime: string;
  homeTeamTime: string;
  day: string;
  monthNum: number;
  weekNumber: number;
  weekName: string;
  ifNecessary: boolean;
  seriesGameNumber: string;
  seriesText: string;
  arenaName: string;
  arenaState: string;
  arenaCity: string;
  postponedStatus: string;
  branchLink: string;
  gameSubtype: string;
  broadcasters: Broadcasters;
  homeTeam: HomeTeam;
  awayTeam: AwayTeam;
  pointsLeaders: PointsLeader[];
}

export interface Broadcasters {
  nationalTvBroadcasters: any[];
  nationalRadioBroadcasters: any[];
  nationalOttBroadcasters: any[];
  homeTvBroadcasters: HomeTvBroadcaster[];
  homeRadioBroadcasters: HomeRadioBroadcaster[];
  homeOttBroadcasters: HomeOttBroadcaster[];
  awayTvBroadcasters: AwayTvBroadcaster[];
  awayRadioBroadcasters: AwayRadioBroadcaster[];
  awayOttBroadcasters: AwayOttBroadcaster[];
  intlRadioBroadcasters: any[];
  intlTvBroadcasters: IntlTvBroadcaster[];
  intlOttBroadcasters: IntlOttBroadcaster[];
}

export interface HomeTvBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface HomeRadioBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface HomeOttBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface AwayTvBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface AwayRadioBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface AwayOttBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface IntlTvBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface IntlOttBroadcaster {
  broadcasterScope: string;
  broadcasterMedia: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  tapeDelayComments: string;
  broadcasterVideoLink: string;
  regionId: number;
  broadcasterTeamId: number;
}

export interface HomeTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number;
}

export interface AwayTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number;
}

export interface PointsLeader {
  personId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  points: number;
}

export interface Week {
  weekNumber: number;
  weekName: string;
  startDate: string;
  endDate: string;
}

export interface BroadcasterList {
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  regionId: number;
}
