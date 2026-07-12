import { describe, expect, it } from "vitest";
import { getRefreshIntervalMs } from "@/lib/matches/refresh-policy";

describe("match refresh policy", () => {
  it("refreshes active or pending matches most often", () => {
    expect(getRefreshIntervalMs({ hasLiveMatch: true, hasPendingResult: false, nextKickoffMs: null })).toBe(60_000);
    expect(getRefreshIntervalMs({ hasLiveMatch: false, hasPendingResult: true, nextKickoffMs: null })).toBe(60_000);
  });

  it("refreshes near kickoff more often than quiet fixtures", () => {
    expect(getRefreshIntervalMs({ hasLiveMatch: false, hasPendingResult: false, nextKickoffMs: 15 * 60_000 })).toBe(120_000);
    expect(getRefreshIntervalMs({ hasLiveMatch: false, hasPendingResult: false, nextKickoffMs: 4 * 60 * 60_000 })).toBe(300_000);
    expect(getRefreshIntervalMs({ hasLiveMatch: false, hasPendingResult: false, nextKickoffMs: null })).toBe(null);
  });
});
