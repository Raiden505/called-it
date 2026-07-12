import { describe, expect, it } from "vitest";
import { predictionInputSchema } from "@/lib/validation/prediction";

describe("predictionInputSchema", () => {
  it("accepts PostgreSQL UUID syntax used by seeded demo records", () => {
    const result = predictionInputSchema.safeParse({
      matchId: "00000000-0000-0000-0000-000000000202",
      homeScore: 1,
      awayScore: 0,
      firstGoalscorerId: null,
      noGoalscorer: false,
      advancedTeamId: null,
      confidenceMultiplier: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed identifiers", () => {
    const result = predictionInputSchema.safeParse({
      matchId: "not-a-uuid",
      homeScore: 1,
      awayScore: 0,
      firstGoalscorerId: null,
      noGoalscorer: false,
      advancedTeamId: null,
      confidenceMultiplier: 1,
    });

    expect(result.success).toBe(false);
  });
});
