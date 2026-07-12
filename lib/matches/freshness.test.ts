import { describe, expect, it } from "vitest";
import { getMatchFreshness } from "@/lib/matches/freshness";

describe("match freshness", () => {
  const now = new Date("2026-07-12T12:00:00Z");

  it("marks recently synced data fresh", () => {
    expect(getMatchFreshness("2026-07-12T11:55:00Z", now)).toBe("fresh");
  });

  it("marks old data stale and missing data unknown", () => {
    expect(getMatchFreshness("2026-07-12T11:00:00Z", now)).toBe("stale");
    expect(getMatchFreshness(null, now)).toBe("unknown");
  });
});
