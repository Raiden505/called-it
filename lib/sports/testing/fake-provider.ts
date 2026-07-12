import type { CompetitionRef, NormalizedFixture, NormalizedPlayer, SportsDataProvider } from "@/lib/sports/contracts";

export class FakeSportsProvider implements SportsDataProvider {
  constructor(private readonly fixtures: NormalizedFixture[] = [], private readonly squads: Record<string, NormalizedPlayer[]> = {}) {}
  async getCompetitionFixtures(input: CompetitionRef): Promise<NormalizedFixture[]> { return this.fixtures.filter((fixture) => fixture.externalCompetitionId === input.codeOrId && fixture.season === input.season); }
  async getFixturesByIds(externalIds: string[]): Promise<NormalizedFixture[]> { return this.fixtures.filter((fixture) => externalIds.includes(fixture.externalFixtureId)); }
  async getTeamSquad(externalTeamId: string): Promise<NormalizedPlayer[]> { return this.squads[externalTeamId] ?? []; }
}
