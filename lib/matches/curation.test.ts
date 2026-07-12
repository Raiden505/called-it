import { describe, expect, it } from "vitest";
import { selectRecentOutcomes } from "@/lib/matches/curation";

const now = new Date("2026-07-12T12:00:00Z");

function outcome(overrides: Partial<Parameters<typeof selectRecentOutcomes>[0][number]> = {}) {
  return {
    id: "match-1",
    status: "finished" as const,
    kickoffAt: "2026-07-12T10:00:00Z",
    hasPrediction: true,
    lifecycle: "scored" as const,
    ...overrides,
  };
}

describe("recent outcome curation", () => {
  it("returns at most the requested number, newest first", () => {
    const matches = [
      outcome({ id: "old", kickoffAt: "2026-07-10T10:00:00Z" }),
      outcome({ id: "newest", kickoffAt: "2026-07-12T11:00:00Z" }),
      outcome({ id: "middle", kickoffAt: "2026-07-11T10:00:00Z" }),
      outcome({ id: "extra", kickoffAt: "2026-07-12T09:00:00Z" }),
    ];

    expect(selectRecentOutcomes(matches, now, 3).items.map((match) => match.id)).toEqual(["newest", "extra", "middle"]);
    expect(selectRecentOutcomes(matches, now, 3).remainingCount).toBe(1);
  });

  it("prioritizes a user's recent predicted outcomes over older unpredicted results", () => {
    const matches = [
      outcome({ id: "predicted", kickoffAt: "2026-07-08T10:00:00Z", hasPrediction: true }),
      outcome({ id: "unpredicted", kickoffAt: "2026-07-12T11:00:00Z", hasPrediction: false }),
      outcome({ id: "too-old", kickoffAt: "2026-07-01T10:00:00Z", hasPrediction: false }),
    ];

    expect(selectRecentOutcomes(matches, now, 2).items.map((match) => match.id)).toEqual(["unpredicted", "predicted"]);
  });
});
