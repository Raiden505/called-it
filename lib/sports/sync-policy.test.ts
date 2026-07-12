import { describe, expect, it } from "vitest";
import { planMatchLifecycle } from "@/lib/sports/sync-policy";
import type { NormalizedFixture } from "@/lib/sports/contracts";

const baseFixture = (overrides: Partial<NormalizedFixture> = {}): Pick<NormalizedFixture, "kickoffAt" | "kickoffConfirmed" | "providerStatus" | "lifecycleStatus"> => ({ kickoffAt: "2026-07-20T12:00:00Z", kickoffConfirmed: true, providerStatus: "SCHEDULED", lifecycleStatus: "scheduled", ...overrides });

describe("match lifecycle policy", () => {
  it("accepts a kickoff correction before the match starts", () => {
    const result = planMatchLifecycle({ kickoffAt: "2026-07-20T12:00:00Z", kickoffConfirmed: true, status: "scheduled", providerStatus: "SCHEDULED", actualStartedAt: null, predictionsClosedAt: null }, baseFixture({ kickoffAt: "2026-07-20T13:00:00Z" }), new Date("2026-07-19T00:00:00Z"));
    expect(result.kickoffAt).toBe("2026-07-20T13:00:00Z"); expect(result.kickoffChanged).toBe(true);
  });
  it("never reopens a started match after a provider correction", () => {
    const result = planMatchLifecycle({ kickoffAt: "2026-07-20T12:00:00Z", kickoffConfirmed: true, status: "live", providerStatus: "IN_PLAY", actualStartedAt: "2026-07-20T12:01:00Z", predictionsClosedAt: "2026-07-20T12:01:00Z" }, baseFixture({ kickoffAt: "2026-07-20T15:00:00Z" }), new Date("2026-07-20T12:05:00Z"));
    expect(result.kickoffAt).toBe("2026-07-20T12:00:00Z"); expect(result.status).toBe("live"); expect(result.kickoffChanged).toBe(false);
  });
  it("reopens a postponed match only with a new future kickoff", () => {
    const result = planMatchLifecycle({ kickoffAt: "2026-07-20T12:00:00Z", kickoffConfirmed: false, status: "postponed", providerStatus: "POSTPONED", actualStartedAt: null, predictionsClosedAt: null }, baseFixture({ kickoffAt: "2026-07-22T12:00:00Z", kickoffConfirmed: true, providerStatus: "SCHEDULED", lifecycleStatus: "scheduled" }), new Date("2026-07-20T12:00:00Z"));
    expect(result.status).toBe("scheduled"); expect(result.kickoffAt).toBe("2026-07-22T12:00:00Z");
  });
  it("closes predictions when a fixture becomes live", () => {
    const result = planMatchLifecycle(null, baseFixture({ providerStatus: "IN_PLAY", lifecycleStatus: "live" }), new Date("2026-07-20T12:01:00Z"));
    expect(result.status).toBe("live"); expect(result.actualStartedAt).toBe("2026-07-20T12:01:00.000Z"); expect(result.predictionsClosedAt).toBe("2026-07-20T12:01:00.000Z");
  });
});
