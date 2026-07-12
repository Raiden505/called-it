import { describe, expect, it } from "vitest";
import { observeResultCandidate } from "@/lib/sports/result-confirmation";
import type { ResultCandidate } from "@/lib/sports/contracts";

const candidate: ResultCandidate = { providerFixtureId: "1", providerStatus: "FINISHED", score90: { home: 1, away: 0 }, scoreFinal: { home: 1, away: 0 }, penaltyScore: null, firstGoalscorerExternalId: "9", firstGoalWasOwnGoal: false, firstGoalscorerKnown: true, advancedExternalTeamId: null, status: "ready", reviewReason: null, hash: "abc" };

describe("result confirmation", () => {
  it("requires two identical observations separated by the stabilization window", () => {
    const first = observeResultCandidate(null, candidate, new Date("2026-07-12T00:00:00Z"));
    const second = observeResultCandidate(first, candidate, new Date("2026-07-12T00:01:30Z"));
    expect(first.status).toBe("candidate"); expect(first.observations).toBe(1); expect(second.status).toBe("confirmed");
  });
  it("resets the observation window when the candidate hash changes", () => {
    const first = observeResultCandidate({ hash: "old", seenAt: "2026-07-12T00:00:00Z", observations: 3, status: "candidate" }, candidate, new Date("2026-07-12T01:00:00Z"));
    expect(first.status).toBe("candidate"); expect(first.observations).toBe(1);
  });
  it("does not confirm manual-review candidates", () => {
    const review = observeResultCandidate(null, { ...candidate, status: "manual_review", reviewReason: "missing_goal" }, new Date("2026-07-12T00:00:00Z"));
    expect(review.status).toBe("manual_review"); expect(review.observations).toBe(0);
  });
});
