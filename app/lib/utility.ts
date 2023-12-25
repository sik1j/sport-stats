// utility function
export function getTeamIdentifierFromTeamLink(teamLink: string) {
  return teamLink.split("/").slice(7,9).join('/');
}