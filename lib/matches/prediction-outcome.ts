export type PredictionOutcome = "home" | "away" | "draw";

export function outcomeForScores(homeScore: number, awayScore: number): PredictionOutcome {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

export function scoresForOutcome(outcome: PredictionOutcome, homeScore: number, awayScore: number): [number, number] {
  if (outcome === "home") return [Math.max(homeScore, awayScore + 1), awayScore];
  if (outcome === "away") return [homeScore, Math.max(awayScore, homeScore + 1)];
  const drawScore = Math.min(homeScore, awayScore);
  return [drawScore, drawScore];
}
