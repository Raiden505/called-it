import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateScore, type MatchResult } from "@/lib/scoring/calculate-score";
import { getCardRarity } from "@/lib/cards/rarity";
import type { ResultProcessingInput } from "@/lib/validation/result";

type MatchSource = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  status: string;
  home_score_90: number | null;
  away_score_90: number | null;
  first_goalscorer_id: string | null;
  first_goal_was_own_goal: boolean;
  advanced_team_id: string | null;
  result_version: number;
};

type PredictionSource = {
  id: string;
  user_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_first_goalscorer_id: string | null;
  predicted_no_goalscorer: boolean;
  confidence_multiplier: 1 | 2 | 3;
};

export type ProcessResultSummary = {
  matchId: string;
  resultVersion: number;
  processedPredictions: number;
};

export async function processMatchResult(
  adminClient: SupabaseClient,
  input: ResultProcessingInput & { resultCandidateHash?: string },
): Promise<ProcessResultSummary> {
  const { data: match, error: matchError } = await adminClient
    .from("matches")
    .select("id, home_team_id, away_team_id, status, home_score_90, away_score_90, first_goalscorer_id, first_goal_was_own_goal, advanced_team_id, result_version")
    .eq("id", input.matchId)
    .single();

  if (matchError || !match) {
    throw new Error("Match not found");
  }

  const matchSource = match as MatchSource;

  if (input.firstGoalscorerId && !await playerBelongsToMatch(adminClient, input.firstGoalscorerId, matchSource)) {
    throw new Error("First goalscorer must belong to one of the teams");
  }

  if (input.advancedTeamId && ![matchSource.home_team_id, matchSource.away_team_id].includes(input.advancedTeamId)) {
    throw new Error("Advanced team must be one of the competing teams");
  }

  const { data: predictions, error: predictionError } = await adminClient
    .from("predictions")
    .select("id, user_id, predicted_home_score, predicted_away_score, predicted_first_goalscorer_id, predicted_no_goalscorer, confidence_multiplier")
    .eq("match_id", input.matchId);

  if (predictionError) {
    throw new Error(predictionError.message);
  }

  const isSameResult = matchSource.status === "finished" &&
    matchSource.home_score_90 === input.homeScore90 &&
    matchSource.away_score_90 === input.awayScore90 &&
    matchSource.first_goalscorer_id === input.firstGoalscorerId &&
    matchSource.first_goal_was_own_goal === input.firstGoalWasOwnGoal &&
    matchSource.advanced_team_id === input.advancedTeamId;
  const resultVersion = isSameResult ? matchSource.result_version : matchSource.result_version + 1;
  const result: MatchResult = {
    actualHomeScore: input.homeScore90,
    actualAwayScore: input.awayScore90,
    firstGoalscorerId: input.firstGoalscorerId,
    firstGoalWasOwnGoal: input.firstGoalWasOwnGoal,
    advancedTeamId: input.advancedTeamId,
  };

  const predictionRows = (predictions ?? []) as PredictionSource[];
  const scoredPredictions = [] as Array<Record<string, unknown>>;

  for (const prediction of predictionRows) {
    const score = calculateScore({
      predictedHomeScore: prediction.predicted_home_score,
      predictedAwayScore: prediction.predicted_away_score,
      predictedFirstGoalscorerId: prediction.predicted_first_goalscorer_id,
      predictedNoGoalscorer: prediction.predicted_no_goalscorer,
      confidenceMultiplier: prediction.confidence_multiplier,
    }, result);
    const { error } = await adminClient
      .from("predictions")
      .update({
        scored_at: new Date().toISOString(),
        scored_result_version: resultVersion,
        outcome_points: score.outcomePoints,
        goal_difference_points: score.goalDifferencePoints,
        exact_score_points: score.exactScorePoints,
        first_goalscorer_points: score.firstGoalscorerPoints,
        advance_points: score.advancePoints,
        base_points: score.basePoints,
        total_points: score.totalPoints,
        is_exact_score: score.isExactScore,
        is_called_it: score.isCalledIt,
      })
      .eq("id", prediction.id);

    if (error) {
      throw new Error(error.message);
    }

    scoredPredictions.push({ id: prediction.id, user_id: prediction.user_id, outcome_points: score.outcomePoints, goal_difference_points: score.goalDifferencePoints, exact_score_points: score.exactScorePoints, first_goalscorer_points: score.firstGoalscorerPoints, advance_points: score.advancePoints, base_points: score.basePoints, total_points: score.totalPoints, is_exact_score: score.isExactScore, is_called_it: score.isCalledIt });
  }
  const rarity = getCardRarity(scoredPredictions.filter((prediction) => prediction.is_called_it === true).length, scoredPredictions.length);
  const { data: appliedVersion, error: applyError } = await adminClient.rpc("apply_processed_match_result", {
    p_match_id: input.matchId,
    p_expected_result_version: matchSource.result_version,
    p_home_score_90: input.homeScore90,
    p_away_score_90: input.awayScore90,
    p_home_score_final: input.homeScoreFinal ?? input.homeScore90,
    p_away_score_final: input.awayScoreFinal ?? input.awayScore90,
    p_first_goalscorer_id: input.firstGoalscorerId,
    p_first_goal_was_own_goal: input.firstGoalWasOwnGoal,
    p_advanced_team_id: input.advancedTeamId,
    p_predictions: scoredPredictions,
    p_card_rarity: rarity.label,
    p_card_rarity_percentage: rarity.percentage,
    p_result_candidate_hash: input.resultCandidateHash ?? null,
  });
  if (applyError || appliedVersion === null || appliedVersion === undefined) throw new Error(applyError?.message ?? "Could not apply processed result");

  return {
    matchId: input.matchId,
    resultVersion: Number(appliedVersion),
    processedPredictions: predictionRows.length,
  };
}

async function playerBelongsToMatch(
  adminClient: SupabaseClient,
  playerId: string,
  match: MatchSource,
): Promise<boolean> {
  const { data } = await adminClient
    .from("players")
    .select("id")
    .eq("id", playerId)
    .in("team_id", [match.home_team_id, match.away_team_id])
    .maybeSingle();
  return Boolean(data);
}
