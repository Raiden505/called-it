import { describe, expect, it } from "vitest";
import { outcomeForScores, scoresForOutcome } from "@/lib/matches/prediction-outcome";

describe("prediction outcomes", () => {
  it("derives winner or draw from the selected scores", () => {
    expect(outcomeForScores(2, 0)).toBe("home");
    expect(outcomeForScores(0, 2)).toBe("away");
    expect(outcomeForScores(1, 1)).toBe("draw");
  });

  it("keeps selected outcomes consistent with goals", () => {
    expect(scoresForOutcome("home", 0, 0)).toEqual([1, 0]);
    expect(scoresForOutcome("away", 2, 0)).toEqual([2, 3]);
    expect(scoresForOutcome("draw", 3, 1)).toEqual([1, 1]);
  });
});
