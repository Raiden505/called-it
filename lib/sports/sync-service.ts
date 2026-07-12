import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompetitionRef, NormalizedFixture, NormalizedPlayer, SportsDataProvider } from "@/lib/sports/contracts";
import { planMatchLifecycle } from "@/lib/sports/sync-policy";
import { nextSyncAtForStatus } from "@/lib/sports/quota-policy";

export type SyncSummary = { fixtureCount: number; teamCount: number; playerCount: number; eventCount: number; syncRunId: string | null; dryRun: boolean };

export async function syncCompetition(input: { adminClient: SupabaseClient; provider: SportsDataProvider; competition: CompetitionRef; triggerType?: "admin" | "cron" | "test"; syncSquads?: boolean; dryRun?: boolean }): Promise<SyncSummary> {
  const startedAt = Date.now();
  if (input.dryRun) {
    const fixtures = await input.provider.getCompetitionFixtures(input.competition);
    return { fixtureCount: fixtures.length, teamCount: uniqueTeams(fixtures).length, playerCount: 0, eventCount: fixtures.reduce((count, fixture) => count + fixture.events.length, 0), syncRunId: null, dryRun: true };
  }
  const { data: run, error: runError } = await input.adminClient.from("sports_sync_runs").insert({ trigger_type: input.triggerType ?? "admin", scope: `competition:${input.competition.codeOrId}:${input.competition.season}`, status: "running" }).select("id").single();
  if (runError || !run) throw new Error(`Could not start sports sync: ${runError?.message ?? "missing run"}`);
  try {
    const fixtures = await input.provider.getCompetitionFixtures(input.competition);
    const tournamentId = await upsertTournament(input.adminClient, input.competition, fixtures);
    const teamIds = new Map<string, string>();
    for (const team of uniqueTeams(fixtures)) teamIds.set(team.externalId, await upsertTeam(input.adminClient, team));
    let eventCount = 0;
    for (const fixture of fixtures) { await upsertFixture(input.adminClient, tournamentId, fixture, teamIds); eventCount += await upsertEvents(input.adminClient, fixture, teamIds); }
    const playerCount = input.syncSquads ? await syncSquads(input.adminClient, input.provider, uniqueTeams(fixtures), teamIds, fixtures) : 0;
    let lineupCount = 0;
    for (const fixture of fixtures) lineupCount += await syncMatchPlayers(input.adminClient, fixture, teamIds);
    await input.adminClient.from("sports_sync_runs").update({ status: "succeeded", finished_at: new Date().toISOString(), fixture_count: fixtures.length, team_count: teamIds.size, player_count: playerCount, event_count: eventCount, duration_ms: Date.now() - startedAt }).eq("id", run.id);
    return { fixtureCount: fixtures.length, teamCount: teamIds.size, playerCount: playerCount + lineupCount, eventCount, syncRunId: run.id, dryRun: false };
  } catch (error) {
    await input.adminClient.from("sports_sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), duration_ms: Date.now() - startedAt, error_code: error instanceof Error ? error.name : "unknown", error_message: error instanceof Error ? error.message.slice(0, 500) : "Sports sync failed" }).eq("id", run.id);
    throw error;
  }
}

async function upsertTournament(client: SupabaseClient, competition: CompetitionRef, fixtures: NormalizedFixture[]): Promise<string> {
  const dates = fixtures.map((fixture) => fixture.kickoffAt).filter((date): date is string => Boolean(date)).sort();
  const row = { provider: "football-data", external_id: competition.codeOrId, name: `Football Data ${competition.codeOrId}`, season: competition.season, starts_at: dates[0] ?? `${competition.season}-01-01T00:00:00Z`, ends_at: dates.at(-1) ?? `${competition.season}-12-31T23:59:59Z`, provider_coverage: { goals: true, lineups: true, squads: true }, sync_enabled: true, last_synced_at: new Date().toISOString() };
  const { data, error } = await client.from("tournaments").upsert(row, { onConflict: "provider,external_id" }).select("id").single();
  if (error || !data) throw new Error(`Could not upsert tournament: ${error?.message ?? "missing id"}`);
  return data.id as string;
}

async function upsertTeam(client: SupabaseClient, team: NormalizedFixture["homeTeam"]): Promise<string> {
  const { data, error } = await client.from("teams").upsert({ provider: "football-data", external_id: team.externalId, name: team.name, short_name: team.shortName, code: team.code, badge_url: team.badgeUrl, country_code: team.countryCode }, { onConflict: "provider,external_id" }).select("id").single();
  if (error || !data) throw new Error(`Could not upsert team: ${error?.message ?? "missing id"}`);
  return data.id as string;
}

async function upsertFixture(client: SupabaseClient, tournamentId: string, fixture: NormalizedFixture, teamIds: Map<string, string>) {
  const { data: existing, error: lookupError } = await client.from("matches").select("kickoff_at,kickoff_confirmed,status,provider_status,actual_started_at,predictions_closed_at").eq("provider", fixture.provider).eq("external_id", fixture.externalFixtureId).maybeSingle();
  if (lookupError) throw new Error(`Could not read existing fixture ${fixture.externalFixtureId}: ${lookupError.message}`);
  const lifecycle = planMatchLifecycle(existing ? { kickoffAt: existing.kickoff_at, kickoffConfirmed: existing.kickoff_confirmed, status: existing.status, providerStatus: existing.provider_status, actualStartedAt: existing.actual_started_at, predictionsClosedAt: existing.predictions_closed_at } : null, fixture);
  const { error } = await client.from("matches").upsert({ provider: fixture.provider, external_id: fixture.externalFixtureId, tournament_id: tournamentId, home_team_id: teamIds.get(fixture.homeTeam.externalId), away_team_id: teamIds.get(fixture.awayTeam.externalId), stage: fixture.stage, kickoff_at: lifecycle.kickoffAt, kickoff_confirmed: lifecycle.kickoffConfirmed, provider_status: lifecycle.providerStatus, status: lifecycle.status, actual_started_at: lifecycle.actualStartedAt, predictions_closed_at: lifecycle.predictionsClosedAt, home_score_90: fixture.score90?.home ?? null, away_score_90: fixture.score90?.away ?? null, home_score_final: fixture.scoreFinal?.home ?? null, away_score_final: fixture.scoreFinal?.away ?? null, penalty_home_score: fixture.penaltyScore?.home ?? null, penalty_away_score: fixture.penaltyScore?.away ?? null, last_synced_at: new Date().toISOString(), next_sync_at: nextSyncAtForStatus(lifecycle.status) }, { onConflict: "provider,external_id" });
  if (error) throw new Error(`Could not upsert fixture ${fixture.externalFixtureId}: ${error.message}`);
}

async function upsertEvents(client: SupabaseClient, fixture: NormalizedFixture, teamIds: Map<string, string>): Promise<number> {
  if (!fixture.events.length) return 0;
  const { data: match, error: matchError } = await client.from("matches").select("id").eq("provider", fixture.provider).eq("external_id", fixture.externalFixtureId).single();
  if (matchError || !match) throw new Error(`Could not find synced fixture ${fixture.externalFixtureId}`);
  const playerIds = new Map<string, string>();
  for (const event of fixture.events.filter((item) => item.playerExternalId)) {
    const { data: player } = await client.from("players").select("id").eq("provider", fixture.provider).eq("external_id", event.playerExternalId as string).maybeSingle();
    if (player) playerIds.set(event.playerExternalId as string, player.id as string);
  }
  const { error } = await client.from("match_events").upsert(fixture.events.map((event) => ({ match_id: match.id, provider: fixture.provider, provider_event_key: event.providerEventKey, source_order: event.sourceOrder, elapsed: event.elapsed, extra: event.extra, event_type: event.eventType, detail: event.detail, team_id: event.teamExternalId ? teamIds.get(event.teamExternalId) : null, player_id: event.playerExternalId ? playerIds.get(event.playerExternalId) ?? null : null, is_goal: event.isGoal, is_own_goal: event.isOwnGoal, is_cancelled: event.isCancelled, payload_hash: event.payloadHash, updated_at: new Date().toISOString() })), { onConflict: "match_id,provider_event_key" });
  if (error) throw new Error(`Could not upsert fixture events: ${error.message}`);
  return fixture.events.length;
}

async function syncSquads(client: SupabaseClient, provider: SportsDataProvider, teams: NormalizedFixture["homeTeam"][], teamIds: Map<string, string>, fixtures: NormalizedFixture[]): Promise<number> {
  let count = 0;
  for (const team of teams) {
    const players = await provider.getTeamSquad(team.externalId);
    for (const player of players) { const playerId = await upsertPlayer(client, player, teamIds.get(team.externalId)); count++; for (const fixture of fixtures.filter((item) => item.homeTeam.externalId === team.externalId || item.awayTeam.externalId === team.externalId)) await client.from("match_players").upsert({ match_id: (await client.from("matches").select("id").eq("provider", fixture.provider).eq("external_id", fixture.externalFixtureId).single()).data?.id, player_id: playerId, team_id: teamIds.get(team.externalId), source: "squad", lineup_role: "squad", last_seen_at: new Date().toISOString() }, { onConflict: "match_id,player_id" }); }
  }
  return count;
}

async function syncMatchPlayers(client: SupabaseClient, fixture: NormalizedFixture, teamIds: Map<string, string>): Promise<number> {
  if (!fixture.matchPlayers?.length) return 0;
  const { data: match, error: matchError } = await client.from("matches").select("id").eq("provider", fixture.provider).eq("external_id", fixture.externalFixtureId).single();
  if (matchError || !match) throw new Error(`Could not find synced fixture ${fixture.externalFixtureId}`);
  let count = 0;
  for (const snapshot of fixture.matchPlayers) {
    const teamId = teamIds.get(snapshot.teamExternalId);
    if (!teamId) continue;
    const playerId = await upsertPlayer(client, snapshot, teamId);
    const { error } = await client.from("match_players").upsert({ match_id: match.id, player_id: playerId, team_id: teamId, source: "lineup", lineup_role: snapshot.lineupRole, is_active: snapshot.isActive, last_seen_at: new Date().toISOString() }, { onConflict: "match_id,player_id" });
    if (error) throw new Error(`Could not upsert match player ${snapshot.externalId}: ${error.message}`);
    count++;
  }
  return count;
}

async function upsertPlayer(client: SupabaseClient, player: NormalizedPlayer, teamId: string | undefined): Promise<string> {
  if (!teamId) throw new Error(`Missing internal team for player ${player.externalId}`);
  const { data, error } = await client.from("players").upsert({ provider: "football-data", external_id: player.externalId, team_id: teamId, name: player.name, position: player.position, photo_url: player.photoUrl, is_active: player.isActive }, { onConflict: "provider,external_id" }).select("id").single();
  if (error || !data) throw new Error(`Could not upsert player: ${error?.message ?? "missing id"}`);
  return data.id as string;
}

function uniqueTeams(fixtures: NormalizedFixture[]) { const teams = new Map<string, NormalizedFixture["homeTeam"]>(); for (const fixture of fixtures) { teams.set(fixture.homeTeam.externalId, fixture.homeTeam); teams.set(fixture.awayTeam.externalId, fixture.awayTeam); } return [...teams.values()]; }
