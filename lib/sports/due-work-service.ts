import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompetitionRef, NormalizedFixture, SportsDataProvider } from "@/lib/sports/contracts";
import { defaultSyncQuotaPolicy, prioritizeDueWork, retryAt, type DueWorkItem, type SyncQuotaPolicy } from "@/lib/sports/quota-policy";
import { syncCompetition } from "@/lib/sports/sync-service";
import { normalizeResultCandidate } from "@/lib/sports/result-normalizer";
import { observeResultCandidate } from "@/lib/sports/result-confirmation";
import { processMatchResult } from "@/lib/scoring/process-result";

export type DueWorkSummary = { selected: number; processed: number; failed: number; skipped: number; resultsProcessed: number; syncRunIds: string[]; dryRun: boolean };

export async function syncDueWork(input: { adminClient: SupabaseClient; provider: SportsDataProvider; competition: CompetitionRef; policy?: SyncQuotaPolicy; dryRun?: boolean; now?: Date }): Promise<DueWorkSummary> {
  const now = input.now ?? new Date();
  const policy = input.policy ?? defaultSyncQuotaPolicy;
  const { data, error } = await input.adminClient.from("matches").select("external_id,status,provider_status,next_sync_at,sync_failure_count,result_processing_status").eq("provider", "football-data").neq("status", "cancelled").neq("result_processing_status", "processed").not("external_id", "is", null).or(`next_sync_at.is.null,next_sync_at.lte.${now.toISOString()}`).order("next_sync_at", { ascending: true, nullsFirst: true }).limit(policy.maxFixturesPerRun);
  if (error) throw new Error(`Could not select due sports work: ${error.message}`);
  const items = prioritizeDueWork((data ?? []).map((row) => ({ externalId: row.external_id as string, status: row.status, providerStatus: row.provider_status, nextSyncAt: row.next_sync_at, syncFailureCount: row.sync_failure_count ?? 0 })), now, policy);
  if (input.dryRun) return { selected: items.length, processed: 0, failed: 0, skipped: 0, resultsProcessed: 0, syncRunIds: [], dryRun: true };
  let processed = 0; let failed = 0; let resultsProcessed = 0; const syncRunIds: string[] = [];
  for (let offset = 0; offset < items.length; offset += policy.maxFixturesPerBatch) {
    const batch = items.slice(offset, offset + policy.maxFixturesPerBatch);
    try {
      const fixtures = await input.provider.getFixturesByIds(batch.map((item) => item.externalId));
      const found = new Set(fixtures.map((fixture) => fixture.externalFixtureId));
      await markMissingAsRetry(input.adminClient, batch.filter((item) => !found.has(item.externalId)), now);
      if (fixtures.length) {
        const result = await syncCompetition({ adminClient: input.adminClient, provider: new ScopedProvider(input.provider, fixtures), competition: input.competition, triggerType: "cron", syncSquads: false });
        syncRunIds.push(result.syncRunId ?? ""); processed += fixtures.length;
        for (const fixture of fixtures) if (await processAutomaticResult(input.adminClient, fixture, now)) resultsProcessed++;
      }
    } catch (error) {
      failed += batch.length;
      await markFailed(input.adminClient, batch, error, now);
    }
  }
  return { selected: items.length, processed, failed, skipped: Math.max(0, items.length - processed - failed), resultsProcessed, syncRunIds: syncRunIds.filter(Boolean), dryRun: false };
}

class ScopedProvider implements SportsDataProvider {
  constructor(private readonly source: SportsDataProvider, private readonly fixtures: NormalizedFixture[]) {}
  async getCompetitionFixtures(): Promise<NormalizedFixture[]> { return this.fixtures; }
  async getFixturesByIds(ids: string[]): Promise<NormalizedFixture[]> { return this.fixtures.filter((fixture) => ids.includes(fixture.externalFixtureId)); }
  async getTeamSquad(id: string) { return this.source.getTeamSquad(id); }
}

async function markMissingAsRetry(client: SupabaseClient, items: DueWorkItem[], now: Date) { for (const item of items) await client.from("matches").update({ next_sync_at: retryAt(0, now), sync_last_error_code: "fixture_not_returned" }).eq("provider", "football-data").eq("external_id", item.externalId); }
async function markFailed(client: SupabaseClient, items: DueWorkItem[], error: unknown, now: Date) { for (const item of items) await client.from("matches").update({ next_sync_at: retryAt(item.syncFailureCount ?? 0, now), sync_failure_count: (item.syncFailureCount ?? 0) + 1, sync_last_error_code: error instanceof Error ? error.name : "provider_error" }).eq("provider", "football-data").eq("external_id", item.externalId); }

async function processAutomaticResult(client: SupabaseClient, fixture: NormalizedFixture, now: Date): Promise<boolean> {
  const candidate = normalizeResultCandidate(fixture);
  const { data: match, error } = await client.from("matches").select("id,result_candidate_hash,result_candidate_seen_at,result_candidate_observations,result_processing_status").eq("provider", fixture.provider).eq("external_id", fixture.externalFixtureId).single();
  if (error || !match) return false;
  const observation = observeResultCandidate({ hash: match.result_candidate_hash, seenAt: match.result_candidate_seen_at, observations: match.result_candidate_observations, status: match.result_processing_status }, candidate, now);
  if (observation.status !== "confirmed") {
    const retryAt = observation.status === "manual_review" ? new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString() : new Date(now.getTime() + 90_000).toISOString();
    await client.from("matches").update({ result_candidate_hash: observation.hash, result_candidate_seen_at: observation.seenAt, result_candidate_observations: observation.observations, result_processing_status: observation.status, sync_last_error_code: candidate.reviewReason, next_sync_at: retryAt }).eq("id", match.id);
    return false;
  }
  const firstGoalscorerId = await resolveProviderId(client, "players", candidate.firstGoalscorerExternalId);
  const advancedTeamId = await resolveProviderId(client, "teams", candidate.advancedExternalTeamId);
  if (candidate.firstGoalscorerExternalId && !firstGoalscorerId || candidate.advancedExternalTeamId && !advancedTeamId) {
    await client.from("matches").update({ result_processing_status: "manual_review", sync_last_error_code: "result_entity_unmapped", next_sync_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString() }).eq("id", match.id);
    return false;
  }
  await client.from("matches").update({ result_processing_status: "processing" }).eq("id", match.id);
  try {
    await processMatchResult(client, { matchId: match.id, homeScore90: candidate.score90!.home, awayScore90: candidate.score90!.away, homeScoreFinal: candidate.scoreFinal?.home ?? null, awayScoreFinal: candidate.scoreFinal?.away ?? null, firstGoalscorerId, firstGoalWasOwnGoal: candidate.firstGoalWasOwnGoal, firstGoalscorerKnown: candidate.firstGoalscorerKnown, advancedTeamId, resultCandidateHash: candidate.hash });
    await client.from("matches").update({ result_candidate_hash: candidate.hash, result_candidate_seen_at: observation.seenAt, result_candidate_observations: observation.observations, result_processing_status: "processed", sync_last_error_code: null, next_sync_at: null }).eq("id", match.id);
    return true;
  } catch (processingError) {
    await client.from("matches").update({ result_processing_status: "failed", sync_last_error_code: processingError instanceof Error ? processingError.name : "result_processing_failed", next_sync_at: retryAt(0, now) }).eq("id", match.id);
    return false;
  }
}

async function resolveProviderId(client: SupabaseClient, table: "players" | "teams", externalId: string | null): Promise<string | null> {
  if (!externalId) return null;
  const { data } = await client.from(table).select("id").eq("provider", "football-data").eq("external_id", externalId).maybeSingle();
  return data?.id as string | null;
}
