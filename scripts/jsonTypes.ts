export interface ExtractedGame {
  nbaGameId: string
  isPreseasonGame: boolean
  gameHasOccured: boolean
  gameDateTimeUTC: string
  homeTeamData: TeamData
  awayTeamData: TeamData
}

export interface TeamData {
  teamName: string
  teamCity: string
  score: number
  players: Player[]
}

// Purpose: Types for the JSON data returned from the NBA API.

// from specific games 
export interface Root {
  game: Game
}

export interface Game {
  gameId: string
  gameCode: string
  gameStatus: number
  gameStatusText: string
  period: number
  gameClock: string
  gameTimeUTC: string
  gameEt: string
  awayTeamId: number
  homeTeamId: number
  duration: string
  attendance: number
  sellout: number
  seriesGameNumber: string
  seriesText: string
  ifNecessary: boolean
  arena: Arena
  officials: Official[]
  broadcasters: Broadcasters
  homeTeam: HomeTeam
  awayTeam: AwayTeam
  lastFiveMeetings: LastFiveMeetings
  pregameCharts: PregameCharts
  postgameCharts: PostgameCharts
  videoAvailableFlag: number
  ptAvailable: number
  ptXYZAvailable: number
  whStatus: number
  hustleStatus: number
  historicalStatus: number
  gameSubtype: string
  branchUrl: string
  ogImage: string
  hideLineScores: boolean
  hideGameCharts: boolean
  homeTeamPlayers: HomeTeamPlayer[]
  awayTeamPlayers: AwayTeamPlayer[]
  hyperlinks: any[]
  pbOdds: PbOdds
  gameRecap: any
}

export interface Arena {
  arenaId: number
  arenaName: string
  arenaCity: string
  arenaState: string
  arenaCountry: string
  arenaTimezone: string
  arenaStreetAddress: string
  arenaPostalCode: string
}

export interface Official {
  personId: number
  name: string
  nameI: string
  firstName: string
  familyName: string
  jerseyNum: string
  assignment: string
}

export interface Broadcasters {
  nationalBroadcasters: any[]
  nationalRadioBroadcasters: NationalRadioBroadcaster[]
  nationalOttBroadcasters: any[]
  homeTvBroadcasters: HomeTvBroadcaster[]
  homeRadioBroadcasters: HomeRadioBroadcaster[]
  homeOttBroadcasters: any[]
  awayTvBroadcasters: AwayTvBroadcaster[]
  awayRadioBroadcasters: AwayRadioBroadcaster[]
  awayOttBroadcasters: any[]
}

export interface NationalRadioBroadcaster {
  broadcasterId: number
  broadcastDisplay: string
  broadcasterDisplay: string
  broadcasterVideoLink: string
  broadcasterTeamId: number
}

export interface HomeTvBroadcaster {
  broadcasterId: number
  broadcastDisplay: string
  broadcasterDisplay: string
  broadcasterVideoLink: string
  broadcasterTeamId: number
}

export interface HomeRadioBroadcaster {
  broadcasterId: number
  broadcastDisplay: string
  broadcasterDisplay: string
  broadcasterVideoLink: string
  broadcasterTeamId: number
}

export interface AwayTvBroadcaster {
  broadcasterId: number
  broadcastDisplay: string
  broadcasterDisplay: string
  broadcasterVideoLink: string
  broadcasterTeamId: number
}

export interface AwayRadioBroadcaster {
  broadcasterId: number
  broadcastDisplay: string
  broadcasterDisplay: string
  broadcasterVideoLink: string
  broadcasterTeamId: number
}

export interface HomeTeam {
  teamId: number
  teamName: string
  teamCity: string
  teamTricode: string
  teamSlug: string
  teamWins: number
  teamLosses: number
  score: number
  inBonus: string
  timeoutsRemaining: number
  seed: number
  statistics: Statistics
  periods: Period[]
  players: Player[]
  inactives: Inac[]
  starters: Starters
  bench: Bench
}

export interface Statistics {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
  plusMinusPoints: number
}

export interface Period {
  period: number
  periodType: string
  score: number
}

export interface Player {
  personId: number
  firstName: string
  familyName: string
  nameI: string
  playerSlug: string
  position: string
  comment: string
  jerseyNum: string
  statistics: Statistics2
}

export interface Statistics2 {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
  plusMinusPoints: number
}

export interface Inac {
  personId: number
  firstName: string
  familyName: string
  jerseyNum: string
}

export interface Starters {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
}

export interface Bench {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
}

export interface AwayTeam {
  teamId: number
  teamName: string
  teamCity: string
  teamTricode: string
  teamSlug: string
  teamWins: number
  teamLosses: number
  score: number
  inBonus: string
  timeoutsRemaining: number
  seed: number
  statistics: Statistics3
  periods: Period2[]
  players: Player2[]
  inactives: Inac2[]
  starters: Starters2
  bench: Bench2
}

export interface Statistics3 {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
  plusMinusPoints: number
}

export interface Period2 {
  period: number
  periodType: string
  score: number
}

export interface Player2 {
  personId: number
  firstName: string
  familyName: string
  nameI: string
  playerSlug: string
  position: string
  comment: string
  jerseyNum: string
  statistics: Statistics4
}

export interface Statistics4 {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
  plusMinusPoints: number
}

export interface Inac2 {
  personId: number
  firstName: string
  familyName: string
  jerseyNum: string
}

export interface Starters2 {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
}

export interface Bench2 {
  minutes: string
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalsPercentage: number
  threePointersMade: number
  threePointersAttempted: number
  threePointersPercentage: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowsPercentage: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  foulsPersonal: number
  points: number
}

export interface LastFiveMeetings {
  meetings: Meeting[]
}

export interface Meeting {
  recencyOrder: number
  gameId: string
  gameTimeUTC: string
  gameEt: string
  gameStatus: number
  gameStatusText: string
  gameClock: string
  awayTeam: AwayTeam2
  homeTeam: HomeTeam2
}

export interface AwayTeam2 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  teamSlug: string
  score: number
  wins: number
  losses: number
}

export interface HomeTeam2 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  teamSlug: string
  score: number
  wins: number
  losses: number
}

export interface PregameCharts {
  homeTeam: HomeTeam3
  awayTeam: AwayTeam3
}

export interface HomeTeam3 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  statistics: Statistics5
}

export interface Statistics5 {
  points: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalsPercentage: number
  threePointersPercentage: number
  freeThrowsPercentage: number
  pointsInThePaint: number
  pointsSecondChance: number
  pointsFastBreak: number
  playerPtsLeaderFirstName: string
  playerPtsLeaderFamilyName: string
  playerPtsLeaderId: number
  playerPtsLeaderPts: number
  playerRebLeaderFirstName: string
  playerRebLeaderFamilyName: string
  playerRebLeaderId: number
  playerRebLeaderReb: number
  playerAstLeaderFirstName: string
  playerAstLeaderFamilyName: string
  playerAstLeaderId: number
  playerAstLeaderAst: number
  playerBlkLeaderFirstName: string
  playerBlkLeaderFamilyName: string
  playerBlkLeaderId: number
  playerBlkLeaderBlk: number
}

export interface AwayTeam3 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  statistics: Statistics6
}

export interface Statistics6 {
  points: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalsPercentage: number
  threePointersPercentage: number
  freeThrowsPercentage: number
  pointsInThePaint: number
  pointsSecondChance: number
  pointsFastBreak: number
  playerPtsLeaderFirstName: string
  playerPtsLeaderFamilyName: string
  playerPtsLeaderId: number
  playerPtsLeaderPts: number
  playerRebLeaderFirstName: string
  playerRebLeaderFamilyName: string
  playerRebLeaderId: number
  playerRebLeaderReb: number
  playerAstLeaderFirstName: string
  playerAstLeaderFamilyName: string
  playerAstLeaderId: number
  playerAstLeaderAst: number
  playerBlkLeaderFirstName: string
  playerBlkLeaderFamilyName: string
  playerBlkLeaderId: number
  playerBlkLeaderBlk: number
}

export interface PostgameCharts {
  homeTeam: HomeTeam4
  awayTeam: AwayTeam4
}

export interface HomeTeam4 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  statistics: Statistics7
}

export interface Statistics7 {
  points: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalsPercentage: number
  threePointersPercentage: number
  freeThrowsPercentage: number
  pointsInThePaint: number
  pointsSecondChance: number
  pointsFastBreak: number
  biggestLead: number
  leadChanges: number
  timesTied: number
  biggestScoringRun: number
  turnoversTeam: number
  turnoversTotal: number
  reboundsTeam: number
  pointsFromTurnovers: number
  benchPoints: number
  playerPtsLeaderFirstName: string
  playerPtsLeaderFamilyName: string
  playerPtsLeaderId: number
  playerPtsLeaderPts: number
  playerRebLeaderFirstName: string
  playerRebLeaderFamilyName: string
  playerRebLeaderId: number
  playerRebLeaderReb: number
  playerAstLeaderFirstName: string
  playerAstLeaderFamilyName: string
  playerAstLeaderId: number
  playerAstLeaderAst: number
  playerBlkLeaderFirstName: string
  playerBlkLeaderFamilyName: string
  playerBlkLeaderId: number
  playerBlkLeaderBlk: number
}

export interface AwayTeam4 {
  teamId: number
  teamCity: string
  teamName: string
  teamTricode: string
  statistics: Statistics8
}

export interface Statistics8 {
  points: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalsPercentage: number
  threePointersPercentage: number
  freeThrowsPercentage: number
  pointsInThePaint: number
  pointsSecondChance: number
  pointsFastBreak: number
  biggestLead: number
  leadChanges: number
  timesTied: number
  biggestScoringRun: number
  turnoversTeam: number
  turnoversTotal: number
  reboundsTeam: number
  pointsFromTurnovers: number
  benchPoints: number
  playerPtsLeaderFirstName: string
  playerPtsLeaderFamilyName: string
  playerPtsLeaderId: number
  playerPtsLeaderPts: number
  playerRebLeaderFirstName: string
  playerRebLeaderFamilyName: string
  playerRebLeaderId: number
  playerRebLeaderReb: number
  playerAstLeaderFirstName: string
  playerAstLeaderFamilyName: string
  playerAstLeaderId: number
  playerAstLeaderAst: number
  playerBlkLeaderFirstName: string
  playerBlkLeaderFamilyName: string
  playerBlkLeaderId: number
  playerBlkLeaderBlk: number
}

export interface HomeTeamPlayer {
  personId: number
  name: string
  nameI: string
  firstName: string
  familyName: string
  jerseyNum: string
}

export interface AwayTeamPlayer {
  personId: number
  name: string
  nameI: string
  firstName: string
  familyName: string
  jerseyNum: string
}

export interface PbOdds {}


// from scheduleLeagueV2_2.json
export interface scheduleRoot {
  meta: scheduleMeta;
  leagueSchedule: scheduleLeagueSchedule;
}

export interface scheduleMeta {
  version: number;
  request: string;
  time: string;
}

export interface scheduleLeagueSchedule {
  seasonYear: string;
  leagueId: string;
  gameDates: scheduleGameDate[];
  weeks: scheduleWeek[];
  broadcasterList: scheduleBroadcasterList[];
}

export interface scheduleGameDate {
  gameDate: string;
  games: scheduleGame[];
}

export interface scheduleGame {
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
  broadcasters: scheduleBroadcasters;
  homeTeam: scheduleHomeTeam;
  awayTeam: scheduleAwayTeam;
  pointsLeaders: schedulePointsLeader[];
}

export interface scheduleBroadcasters {
  nationalTvBroadcasters: any[];
  nationalRadioBroadcasters: any[];
  nationalOttBroadcasters: any[];
  homeTvBroadcasters: scheduleHomeTvBroadcaster[];
  homeRadioBroadcasters: scheduleHomeRadioBroadcaster[];
  homeOttBroadcasters: scheduleHomeOttBroadcaster[];
  awayTvBroadcasters: scheduleAwayTvBroadcaster[];
  awayRadioBroadcasters: scheduleAwayRadioBroadcaster[];
  awayOttBroadcasters: scheduleAwayOttBroadcaster[];
  intlRadioBroadcasters: any[];
  intlTvBroadcasters: scheduleIntlTvBroadcaster[];
  intlOttBroadcasters: scheduleIntlOttBroadcaster[];
}

export interface scheduleHomeTvBroadcaster {
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

export interface scheduleHomeRadioBroadcaster {
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

export interface scheduleHomeOttBroadcaster {
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

export interface scheduleAwayTvBroadcaster {
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

export interface scheduleAwayRadioBroadcaster {
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

export interface scheduleAwayOttBroadcaster {
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

export interface scheduleIntlTvBroadcaster {
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

export interface scheduleIntlOttBroadcaster {
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

export interface scheduleHomeTeam {
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

export interface scheduleAwayTeam {
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

export interface schedulePointsLeader {
  personId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  points: number;
}

export interface scheduleWeek {
  weekNumber: number;
  weekName: string;
  startDate: string;
  endDate: string;
}

export interface scheduleBroadcasterList {
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation: string;
  regionId: number;
}
