export type ConfidenceMultiplier = 1 | 2 | 3;

export type PredictionForScoring = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedFirstGoalscorerId: string | null;
  predictedNoGoalscorer: boolean;
  confidenceMultiplier: ConfidenceMultiplier;
  predictedAdvancedTeamId?: string | null;
};

export type MatchResult = {
  actualHomeScore: number;
  actualAwayScore: number;
  firstGoalscorerId: string | null;
  firstGoalWasOwnGoal: boolean;
  advancedTeamId?: string | null;
};

export type ScoreBreakdown = {
  outcomePoints: number;
  goalDifferencePoints: number;
  exactScorePoints: number;
  firstGoalscorerPoints: number;
  advancePoints: number;
  basePoints: number;
  multiplier: ConfidenceMultiplier;
  totalPoints: number;
  isExactScore: boolean;
  isCalledIt: boolean;
};

type MatchOutcome = "HOME" | "DRAW" | "AWAY";

function outcome(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return "HOME";
  if (homeScore < awayScore) return "AWAY";
  return "DRAW";
}

export function calculateScore(
  prediction: PredictionForScoring,
  result: MatchResult,
): ScoreBreakdown {
  const outcomePoints = outcome(prediction.predictedHomeScore, prediction.predictedAwayScore) ===
    outcome(result.actualHomeScore, result.actualAwayScore)
    ? 3
    : 0;
  const goalDifferencePoints = prediction.predictedHomeScore - prediction.predictedAwayScore ===
    result.actualHomeScore - result.actualAwayScore
    ? 2
    : 0;
  const isExactScore = prediction.predictedHomeScore === result.actualHomeScore &&
    prediction.predictedAwayScore === result.actualAwayScore;
  const exactScorePoints = isExactScore ? 3 : 0;
  const isNoGoalscorerCorrect = prediction.predictedNoGoalscorer &&
    result.actualHomeScore === 0 &&
    result.actualAwayScore === 0 &&
    result.firstGoalscorerId === null;
  const isPlayerGoalscorerCorrect = !result.firstGoalWasOwnGoal &&
    !prediction.predictedNoGoalscorer &&
    prediction.predictedFirstGoalscorerId !== null &&
    prediction.predictedFirstGoalscorerId === result.firstGoalscorerId;
  const firstGoalscorerPoints = isNoGoalscorerCorrect || isPlayerGoalscorerCorrect ? 4 : 0;
  const advancePoints = 0;
  const basePoints = outcomePoints + goalDifferencePoints + exactScorePoints + firstGoalscorerPoints + advancePoints;
  const isCalledIt = isExactScore && firstGoalscorerPoints === 4 && (
    prediction.predictedNoGoalscorer || prediction.predictedFirstGoalscorerId !== null
  );

  return {
    outcomePoints,
    goalDifferencePoints,
    exactScorePoints,
    firstGoalscorerPoints,
    advancePoints,
    basePoints,
    multiplier: prediction.confidenceMultiplier,
    totalPoints: basePoints * prediction.confidenceMultiplier,
    isExactScore,
    isCalledIt,
  };
}
