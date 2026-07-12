import { describe, expect, it } from "vitest";
import { parseMatchDeskFilters, parseResultsArchiveFilters } from "@/lib/matches/filter-schema";

describe("match desk filters", () => {
  it("accepts known filters and defaults to the action-oriented desk", () => {
    expect(parseMatchDeskFilters(new URLSearchParams("view=live&team=arsenal"))).toEqual({ view: "live", teamId: "arsenal" });
    expect(parseMatchDeskFilters(new URLSearchParams())).toEqual({ view: "to-predict", teamId: null });
  });

  it("falls back safely for unknown values", () => {
    expect(parseMatchDeskFilters(new URLSearchParams("view=anything&team="))).toEqual({ view: "to-predict", teamId: null });
  });
});

describe("results archive filters", () => {
  it("defaults to the user's results and accepts archive filters", () => {
    expect(parseResultsArchiveFilters(new URLSearchParams("scope=all&team=team-1&stage=Final&from=2026-07-01&to=2026-07-12&processing=pending"))).toEqual({ scope: "all", teamId: "team-1", stage: "Final", from: "2026-07-01", to: "2026-07-12", processing: "pending" });
    expect(parseResultsArchiveFilters(new URLSearchParams())).toEqual({ scope: "mine", teamId: null, stage: null, from: null, to: null, processing: "all" });
  });

  it("falls back safely for unsupported archive values", () => {
    expect(parseResultsArchiveFilters(new URLSearchParams("scope=private&processing=unknown"))).toMatchObject({ scope: "mine", processing: "all" });
  });
});
