import { describe, expect, it } from "vitest";
import { getFreshnessLabel, getMatchLifecycleState } from "@/lib/matches/freshness";

describe("match lifecycle labels", () => {
  it("distinguishes live, pending, and confirmed results", () => {
    expect(getMatchLifecycleState("live", "not_ready").label).toBe("Live");
    expect(getMatchLifecycleState("finished", "candidate").label).toBe("Result pending");
    expect(getMatchLifecycleState("finished", "processed").label).toBe("Confirmed");
  });

  it("explains postponed and cancelled fixtures", () => {
    expect(getMatchLifecycleState("postponed", "not_ready").tone).toBe("warning");
    expect(getMatchLifecycleState("cancelled", "not_ready").description).toContain("will not be played");
  });

  it("provides readable freshness labels", () => {
    expect(getFreshnessLabel("fresh")).toBe("Data fresh");
    expect(getFreshnessLabel("stale")).toBe("Data may be out of date");
    expect(getFreshnessLabel("unknown")).toBe("Awaiting first sync");
  });
});
