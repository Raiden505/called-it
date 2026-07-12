import { describe, expect, it } from "vitest";
import { getResultPresentationState } from "@/lib/matches/result-presentation";

describe("result presentation state", () => {
  it("never shows points before the result is confirmed", () => {
    for (const processingStatus of ["not_ready", "candidate", "processing", "manual_review", "failed"] as const) {
      const state = getResultPresentationState({ status: "finished", resultProcessingStatus: processingStatus, resultVersion: 1, scoredResultVersion: 1, totalPoints: 8 });
      expect(state.pointsVisible).toBe(false);
    }
  });

  it("shows scored points only when the prediction version matches", () => {
    expect(getResultPresentationState({ status: "finished", resultProcessingStatus: "processed", resultVersion: 2, scoredResultVersion: 2, totalPoints: 8 })).toMatchObject({ key: "scored", pointsVisible: true, totalPoints: 8 });
    expect(getResultPresentationState({ status: "finished", resultProcessingStatus: "processed", resultVersion: 2, scoredResultVersion: 1, totalPoints: 8 })).toMatchObject({ key: "recalculating", pointsVisible: false });
  });

  it("maps postponed and cancelled fixtures to non-scoring states", () => {
    expect(getResultPresentationState({ status: "postponed", resultProcessingStatus: "not_ready", resultVersion: 0, scoredResultVersion: null, totalPoints: 0 }).key).toBe("postponed");
    expect(getResultPresentationState({ status: "cancelled", resultProcessingStatus: "not_ready", resultVersion: 0, scoredResultVersion: null, totalPoints: 0 }).key).toBe("cancelled");
  });

  it("does not label a confirmed result without a user prediction as recalculating", () => {
    expect(getResultPresentationState({ status: "finished", resultProcessingStatus: "processed", resultVersion: 1, scoredResultVersion: null, totalPoints: 0, hasPrediction: false })).toMatchObject({ key: "scored", label: "Result confirmed", pointsVisible: false });
  });
});
