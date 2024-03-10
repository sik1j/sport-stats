"use server";
import { PrismaClient } from "@prisma/client";

export { getTeams, getTeamPlayers, getAllPlayers, getPlayerStats };

const prisma = new PrismaClient();

async function getTeams() {
  const teams = await prisma.team.findMany({
    orderBy: {
      teamName: "asc",
    },
  });
  return teams;
}

async function getTeamPlayers(teamName: string) {
  const players = await prisma.player.findMany({
    where: {
      team: {
        teamName: teamName,
      },
    },
    orderBy: {
      familyName: "asc",
    },
  });
  return players;
}

async function getAllPlayers() {
  const players = await prisma.player.findMany();
  return players;
}

async function getPlayerStats(id: number) {
  const playerStats = await prisma.playerStat.findMany({
    where: {
      playerId: id,
    },
  });
  return playerStats;
}
