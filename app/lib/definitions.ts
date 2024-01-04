export type Team = {
    id: string;
    name: string;
    link: string;
}

export type Player = {
    id: string;
    name: string;
    team_id: string;
    espn_id: string;
}

export type Game = {
    id: string;
    date: Date;
    home_team_id: string;
    away_team_id: string;
}