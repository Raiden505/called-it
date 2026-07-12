import { describe, expect, it } from "vitest";
import { normalizeResultCandidate } from "@/lib/sports/result-normalizer";
import type { NormalizedFixture } from "@/lib/sports/contracts";

const base: NormalizedFixture = { provider: "football-data", externalFixtureId: "100", externalCompetitionId: "WC", season: "2026", stage: "REGULAR_SEASON", kickoffAt: "2026-07-11T15:00:00Z", kickoffConfirmed: true, providerStatus: "FINISHED", lifecycleStatus: "finished_candidate", homeTeam: { externalId: "1", name: "Home", shortName: "Home", code: null, badgeUrl: null, countryCode: null }, awayTeam: { externalId: "2", name: "Away", shortName: "Away", code: null, badgeUrl: null, countryCode: null }, score90: { home: 2, away: 1 }, scoreFinal: { home: 2, away: 1 }, penaltyScore: null, winnerExternalTeamId: "1", events: [{ providerEventKey: "1", sourceOrder: 0, elapsed: 12, extra: null, eventType: "goal", detail: "REGULAR", teamExternalId: "1", playerExternalId: "8", isGoal: true, isOwnGoal: false, isCancelled: false, payloadHash: "x" }], providerUpdatedAt: null };

describe("result candidate normalization", () => {
  it("confirms a regular finished result and chooses the earliest goal", () => { const result = normalizeResultCandidate(base); expect(result.status).toBe("ready"); expect(result.firstGoalscorerExternalId).toBe("8"); expect(result.hash).toHaveLength(64); });
  it("does not auto-confirm extra-time or shootout data without regulation score", () => { const result = normalizeResultCandidate({ ...base, score90: null, penaltyScore: { home: 4, away: 3 } }); expect(result.status).toBe("manual_review"); expect(result.reviewReason).toBe("regulation_or_final_score_missing"); });
  it("supports 0–0 with no goals and rejects conflicting goal events", () => { const clean = normalizeResultCandidate({ ...base, score90: { home: 0, away: 0 }, scoreFinal: { home: 0, away: 0 }, events: [] }); expect(clean.status).toBe("ready"); const conflict = normalizeResultCandidate({ ...base, score90: { home: 0, away: 0 }, scoreFinal: { home: 0, away: 0 } }); expect(conflict.status).toBe("manual_review"); });
  it("allows score scoring when the provider omits goal events", () => {
    const result = normalizeResultCandidate({ ...base, events: [] });

    expect(result.status).toBe("ready");
    expect(result.firstGoalscorerExternalId).toBeNull();
    expect(result.firstGoalscorerKnown).toBe(false);
  });
  it("keeps own-goal identity without awarding a player scorer", () => { const result = normalizeResultCandidate({ ...base, events: [{ ...base.events[0], isOwnGoal: true, playerExternalId: null }] }); expect(result.status).toBe("ready"); expect(result.firstGoalWasOwnGoal).toBe(true); expect(result.firstGoalscorerExternalId).toBeNull(); });
});
