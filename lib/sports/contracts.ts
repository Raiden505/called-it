export type SportsProvider = "football-data";

export type ProviderStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "EXTRA_TIME"
  | "PENALTY_SHOOTOUT"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export type FixtureLifecycleStatus = "scheduled" | "live" | "finished_candidate" | "postponed" | "cancelled";

export type NormalizedTeam = {
  externalId: string;
  name: string;
  shortName: string;
  code: string | null;
  badgeUrl: string | null;
  countryCode: string | null;
};

export type NormalizedPlayer = {
  externalId: string;
  teamExternalId: string;
  name: string;
  position: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

export type NormalizedMatchPlayer = NormalizedPlayer & { lineupRole: "starter" | "substitute" };

export type NormalizedMatchEvent = {
  providerEventKey: string;
  sourceOrder: number;
  elapsed: number | null;
  extra: number | null;
  eventType: "goal";
  detail: string | null;
  teamExternalId: string | null;
  playerExternalId: string | null;
  isGoal: boolean;
  isOwnGoal: boolean;
  isCancelled: boolean;
  payloadHash: string;
};

export type NormalizedFixture = {
  provider: SportsProvider;
  externalFixtureId: string;
  externalCompetitionId: string;
  season: string;
  stage: string;
  kickoffAt: string | null;
  kickoffConfirmed: boolean;
  providerStatus: ProviderStatus;
  lifecycleStatus: FixtureLifecycleStatus;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  score90: { home: number; away: number } | null;
  scoreFinal: { home: number; away: number } | null;
  penaltyScore: { home: number; away: number } | null;
  winnerExternalTeamId: string | null;
  events: NormalizedMatchEvent[];
  matchPlayers?: NormalizedMatchPlayer[];
  providerUpdatedAt: string | null;
};

export type ResultCandidate = {
  providerFixtureId: string;
  providerStatus: ProviderStatus;
  score90: { home: number; away: number } | null;
  scoreFinal: { home: number; away: number } | null;
  penaltyScore: { home: number; away: number } | null;
  firstGoalscorerExternalId: string | null;
  firstGoalWasOwnGoal: boolean;
  advancedExternalTeamId: string | null;
  status: "ready" | "not_ready" | "manual_review";
  reviewReason: string | null;
  hash: string;
};

export type CompetitionRef = { codeOrId: string; season: string };

export interface SportsDataProvider {
  getCompetitionFixtures(input: CompetitionRef): Promise<NormalizedFixture[]>;
  getFixturesByIds(externalIds: string[]): Promise<NormalizedFixture[]>;
  getTeamSquad(externalTeamId: string): Promise<NormalizedPlayer[]>;
}
