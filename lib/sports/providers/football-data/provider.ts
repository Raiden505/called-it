import type { CompetitionRef, NormalizedFixture, NormalizedPlayer, SportsDataProvider } from "@/lib/sports/contracts";
import { normalizeMatch, normalizeTeamSquad } from "@/lib/sports/providers/football-data/normalize";
import { FootballDataClient } from "@/lib/sports/providers/football-data/client";
export class FootballDataProvider implements SportsDataProvider {
  constructor(private readonly client: FootballDataClient) {}
  async getCompetitionFixtures(input: CompetitionRef): Promise<NormalizedFixture[]> { const matches = await this.client.getMatches(`/competitions/${encodeURIComponent(input.codeOrId)}/matches?season=${encodeURIComponent(input.season)}`); return matches.filter((match) => match.homeTeam.id !== null && match.homeTeam.name !== null && match.awayTeam.id !== null && match.awayTeam.name !== null).map((match) => normalizeMatch(match, input.season)); }
  async getFixturesByIds(externalIds: string[]): Promise<NormalizedFixture[]> { const fixtures = await Promise.all(externalIds.map((id) => this.client.getMatch(id))); return fixtures.map((match) => normalizeMatch(match, match.season?.startDate.slice(0, 4) ?? "unknown")); }
  async getTeamSquad(externalTeamId: string): Promise<NormalizedPlayer[]> { return normalizeTeamSquad(await this.client.getTeam(externalTeamId)); }
}
