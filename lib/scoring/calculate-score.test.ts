import { describe, expect, it } from "vitest";
import { calculateScore, type MatchResult, type PredictionForScoring } from "@/lib/scoring/calculate-score";

const basePrediction: PredictionForScoring = {
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  predictedFirstGoalscorerId: "player-1",
  predictedNoGoalscorer: false,
  confidenceMultiplier: 1,
};

const baseResult: MatchResult = {
  actualHomeScore: 1,
  actualAwayScore: 0,
  firstGoalscorerId: "player-2",
  firstGoalWasOwnGoal: false,
};

describe("calculateScore", () => {
  it("awards outcome and goal-difference points independently", () => {
    const score = calculateScore(basePrediction, baseResult);

    expect(score.outcomePoints).toBe(3);
    expect(score.goalDifferencePoints).toBe(2);
    expect(score.exactScorePoints).toBe(0);
    expect(score.basePoints).toBe(5);
    expect(score.totalPoints).toBe(5);
  });

  it("awards exact score and first goalscorer points", () => {
    const score = calculateScore(
      { ...basePrediction, confidenceMultiplier: 2 },
      {
        actualHomeScore: 2,
        actualAwayScore: 1,
        firstGoalscorerId: "player-1",
        firstGoalWasOwnGoal: false,
      },
    );

    expect(score.basePoints).toBe(12);
    expect(score.totalPoints).toBe(24);
    expect(score.isExactScore).toBe(true);
    expect(score.isCalledIt).toBe(true);
  });

  it("does not award a player for an own goal", () => {
    const score = calculateScore(
      basePrediction,
      { ...baseResult, firstGoalscorerId: "player-1", firstGoalWasOwnGoal: true },
    );

    expect(score.firstGoalscorerPoints).toBe(0);
    expect(score.isCalledIt).toBe(false);
  });

  it("awards no-goalscorer points for a 0–0 match", () => {
    const score = calculateScore(
      {
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        predictedFirstGoalscorerId: null,
        predictedNoGoalscorer: true,
        confidenceMultiplier: 1,
      },
      {
        actualHomeScore: 0,
        actualAwayScore: 0,
        firstGoalscorerId: null,
        firstGoalWasOwnGoal: false,
      },
    );

    expect(score.firstGoalscorerPoints).toBe(4);
    expect(score.totalPoints).toBe(12);
    expect(score.isCalledIt).toBe(true);
  });

  it("does not award scorer points when provider scorer data is unavailable", () => {
    const score = calculateScore(
      {
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        predictedFirstGoalscorerId: null,
        predictedNoGoalscorer: true,
        confidenceMultiplier: 1,
      },
      {
        actualHomeScore: 0,
        actualAwayScore: 0,
        firstGoalscorerId: null,
        firstGoalWasOwnGoal: false,
        firstGoalscorerKnown: false,
      },
    );

    expect(score.firstGoalscorerPoints).toBe(0);
    expect(score.isCalledIt).toBe(false);
  });

  it("does not award Called It when the first-goalscorer choice is omitted", () => {
    const score = calculateScore(
      {
        ...basePrediction,
        predictedFirstGoalscorerId: null,
        predictedNoGoalscorer: false,
      },
      {
        actualHomeScore: 2,
        actualAwayScore: 1,
        firstGoalscorerId: "player-1",
        firstGoalWasOwnGoal: false,
      },
    );

    expect(score.exactScorePoints).toBe(3);
    expect(score.firstGoalscorerPoints).toBe(0);
    expect(score.isCalledIt).toBe(false);
  });

  it("keeps knockout scoring based on the supplied regulation-time result", () => {
    const score = calculateScore(
      { ...basePrediction, predictedHomeScore: 1, predictedAwayScore: 1 },
      {
        actualHomeScore: 1,
        actualAwayScore: 1,
        firstGoalscorerId: "player-1",
        firstGoalWasOwnGoal: false,
        advancedTeamId: "team-1",
      },
    );

    expect(score.outcomePoints).toBe(3);
    expect(score.goalDifferencePoints).toBe(2);
    expect(score.exactScorePoints).toBe(3);
    expect(score.advancePoints).toBe(0);
  });
});
