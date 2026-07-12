import { describe, expect, it } from "vitest";
import { nextSyncAtForStatus, prioritizeDueWork, retryAt } from "@/lib/sports/quota-policy";

describe("sports sync quota policy", () => {
  it("prioritizes finished work and applies the run cap", () => {
    const items = ["scheduled", "finished", "live"].map((status, index) => ({ externalId: String(index), status: status as "scheduled" | "live" | "finished", providerStatus: null, nextSyncAt: null }));
    expect(prioritizeDueWork(items, new Date("2026-07-12T00:00:00Z"), { maxFixturesPerRun: 2, maxFixturesPerBatch: 1, resultReserve: 1 }).map((item) => item.status)).toEqual(["finished", "live"]);
  });
  it("backs off provider failures with a capped retry time", () => {
    expect(retryAt(0, new Date("2026-07-12T00:00:00Z"))).toBe("2026-07-12T00:01:00.000Z");
    expect(new Date(retryAt(99, new Date("2026-07-12T00:00:00Z"))).getTime()).toBe(new Date("2026-07-12T01:00:00.000Z").getTime());
  });
  it("refreshes live and finished matches frequently but stops cancelled work", () => {
    expect(nextSyncAtForStatus("live", new Date("2026-07-12T00:00:00Z"))).toBe("2026-07-12T00:01:00.000Z");
    expect(nextSyncAtForStatus("cancelled")).toBeNull();
  });
});
