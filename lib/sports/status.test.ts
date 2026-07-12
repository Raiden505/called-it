import { describe, expect, it } from "vitest";
import { mapProviderStatus } from "@/lib/sports/status";

describe("provider status mapping", () => {
  it.each([["SCHEDULED", "scheduled"], ["TIMED", "scheduled"], ["IN_PLAY", "live"], ["PAUSED", "live"], ["EXTRA_TIME", "live"], ["PENALTY_SHOOTOUT", "live"], ["SUSPENDED", "live"], ["FINISHED", "finished_candidate"], ["POSTPONED", "postponed"], ["CANCELLED", "cancelled"], ["AWARDED", "cancelled"]] as const)("maps %s", (status, expected) => { expect(mapProviderStatus(status)).toBe(expected); });
});
