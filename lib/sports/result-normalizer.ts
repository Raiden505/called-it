import { createHash } from "node:crypto";
import type { NormalizedFixture, ResultCandidate } from "@/lib/sports/contracts";

export function normalizeResultCandidate(fixture: NormalizedFixture): ResultCandidate {
  const firstGoal = [...fixture.events].sort((a, b) => (a.elapsed ?? Number.MAX_SAFE_INTEGER) - (b.elapsed ?? Number.MAX_SAFE_INTEGER) || (a.extra ?? 0) - (b.extra ?? 0) || a.sourceOrder - b.sourceOrder)[0] ?? null;
  const scoreIsZero = fixture.scoreFinal?.home === 0 && fixture.scoreFinal.away === 0;
  let status: ResultCandidate["status"] = "ready";
  let reviewReason: string | null = null;
  if (fixture.providerStatus !== "FINISHED") { status = "not_ready"; reviewReason = "fixture_not_finished"; }
  else if (!fixture.score90 || !fixture.scoreFinal) { status = "manual_review"; reviewReason = "regulation_or_final_score_missing"; }
  else if (scoreIsZero && firstGoal) { status = "manual_review"; reviewReason = "zero_score_contains_goal_event"; }
  else if (!scoreIsZero && !firstGoal) { status = "manual_review"; reviewReason = "non_zero_score_missing_goal_event"; }
  const candidate = { providerFixtureId: fixture.externalFixtureId, providerStatus: fixture.providerStatus, score90: fixture.score90, scoreFinal: fixture.scoreFinal, penaltyScore: fixture.penaltyScore, firstGoalscorerExternalId: firstGoal?.playerExternalId ?? null, firstGoalWasOwnGoal: firstGoal?.isOwnGoal ?? false, advancedExternalTeamId: fixture.winnerExternalTeamId, status, reviewReason };
  return { ...candidate, hash: createHash("sha256").update(JSON.stringify(candidate)).digest("hex") };
}
