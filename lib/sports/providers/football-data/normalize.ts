import type { FootballDataMatch, FootballDataTeamResponse } from "@/lib/sports/providers/football-data/schemas";
import { mapProviderStatus } from "@/lib/sports/status";
import type { NormalizedFixture, NormalizedPlayer, NormalizedMatchEvent, NormalizedTeam, NormalizedMatchPlayer } from "@/lib/sports/contracts";

function toTeam(team: FootballDataMatch["homeTeam"]): NormalizedTeam { if (team.id === null || team.name === null) throw new Error("Cannot normalize a fixture with an unresolved team"); return { externalId: String(team.id), name: team.name, shortName: team.shortName || team.name, code: team.tla ?? null, badgeUrl: team.crest ?? null, countryCode: team.area?.code ?? null }; }
function scorePair(pair: { home?: number | null; away?: number | null } | undefined) { return pair?.home != null && pair.away != null ? { home: pair.home, away: pair.away } : null; }

export function normalizeMatch(match: FootballDataMatch, configuredSeason: string): NormalizedFixture {
  const events: NormalizedMatchEvent[] = (match.goals ?? []).map((goal, index) => ({
    providerEventKey: [goal.minute ?? "na", goal.injuryTime ?? 0, goal.type, goal.team.id, goal.scorer?.id ?? "na", index].join(":"), sourceOrder: index,
    elapsed: goal.minute ?? null, extra: goal.injuryTime ?? null, eventType: "goal", detail: goal.type, teamExternalId: String(goal.team.id), playerExternalId: goal.scorer?.id ? String(goal.scorer.id) : null,
    isGoal: true, isOwnGoal: goal.type === "OWN", isCancelled: false, payloadHash: JSON.stringify(goal),
  }));
  return { provider: "football-data", externalFixtureId: String(match.id), externalCompetitionId: String(match.competition.id), season: configuredSeason, stage: match.stage ?? "REGULAR_SEASON", kickoffAt: match.utcDate ?? null, kickoffConfirmed: Boolean(match.utcDate), providerStatus: match.status, lifecycleStatus: mapProviderStatus(match.status), homeTeam: toTeam(match.homeTeam), awayTeam: toTeam(match.awayTeam), score90: match.score.duration === "REGULAR" ? scorePair(match.score.fullTime) : null, scoreFinal: scorePair(match.score.fullTime), penaltyScore: scorePair(match.score.penalties), winnerExternalTeamId: match.score.winner === "HOME" ? String(match.homeTeam.id) : match.score.winner === "AWAY" ? String(match.awayTeam.id) : null, events, matchPlayers: [...toMatchPlayers(match.homeTeam, String(match.homeTeam.id)), ...toMatchPlayers(match.awayTeam, String(match.awayTeam.id))], providerUpdatedAt: match.lastUpdated ?? null };
}
export function normalizeTeamSquad(team: FootballDataTeamResponse): NormalizedPlayer[] { return (team.squad ?? []).map((player) => ({ externalId: String(player.id), teamExternalId: String(team.id), name: player.name, position: player.position ?? null, photoUrl: null, isActive: true })); }
function toMatchPlayers(team: FootballDataMatch["homeTeam"], teamExternalId: string): NormalizedMatchPlayer[] { return [...(team.lineup ?? []).map((player) => ({ ...toPlayer(player, teamExternalId), lineupRole: "starter" as const })), ...(team.bench ?? []).map((player) => ({ ...toPlayer(player, teamExternalId), lineupRole: "substitute" as const }))]; }
function toPlayer(player: { id: number; name: string; position?: string | null }, teamExternalId: string): NormalizedPlayer { return { externalId: String(player.id), teamExternalId, name: player.name, position: player.position ?? null, photoUrl: null, isActive: true }; }
