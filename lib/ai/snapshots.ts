import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentProfile, getLeaderboard, getProfileStats } from "@/lib/leaderboards/queries";

type ScoredPrediction = {
  total_points: number;
  confidence_multiplier: 1 | 2 | 3;
};

export async function buildPersonalSnapshot(supabase: SupabaseClient, userId: string) {
  const [profile, stats, predictionResult] = await Promise.all([
    getCurrentProfile(supabase, userId),
    getProfileStats(supabase, userId),
    supabase.from("predictions").select("total_points, confidence_multiplier").eq("user_id", userId).not("scored_at", "is", null).order("scored_at", { ascending: false }).limit(12),
  ]);
  if (predictionResult.error) {
    throw new Error(predictionResult.error.message);
  }

  const predictions = (predictionResult.data ?? []) as ScoredPrediction[];
  const confidencePerformance = [1, 2, 3].reduce<Record<string, number | null>>((result, multiplier) => {
    const matching = predictions.filter((prediction) => prediction.confidence_multiplier === multiplier);
    result[`${multiplier}x`] = matching.length ? round(matching.reduce((sum, prediction) => sum + prediction.total_points, 0) / matching.length) : null;
    return result;
  }, {});

  return {
    displayName: profile?.display_name ?? "Predictor",
    predictionsMade: stats?.predictions_made ?? 0,
    correctOutcomes: stats?.correct_outcomes ?? 0,
    exactScores: stats?.exact_scores ?? 0,
    calledItCards: stats?.called_it_cards ?? 0,
    currentStreak: stats?.current_streak ?? 0,
    averagePoints: stats?.average_points ?? 0,
    recentAveragePoints: predictions.length ? round(predictions.slice(0, 5).reduce((sum, prediction) => sum + prediction.total_points, 0) / Math.min(predictions.length, 5)) : null,
    confidencePerformance,
  };
}

export async function buildFriendsSnapshot(supabase: SupabaseClient, userId: string) {
  const [profile, rows] = await Promise.all([getCurrentProfile(supabase, userId), getLeaderboard(supabase, "friends")]);
  const currentUser = rows.find((row) => row.user_id === userId);

  return {
    displayName: profile?.display_name ?? "Predictor",
    friendCount: Math.max(0, rows.length - 1),
    currentRank: currentUser?.rank ?? null,
    currentPoints: currentUser?.total_points ?? 0,
    currentStreak: currentUser?.current_streak ?? 0,
    leaders: rows.slice(0, 5).map((row) => ({ displayName: row.display_name, rank: row.rank, totalPoints: row.total_points, calledItCards: row.called_it_cards })),
  };
}

function round(value: number) {
  return Number(value.toFixed(2));
}
