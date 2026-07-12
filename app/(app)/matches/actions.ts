"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { predictionInputSchema, type PredictionInput } from "@/lib/validation/prediction";

export type PredictionActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitPrediction(input: PredictionInput): Promise<PredictionActionResult> {
  const parsedInput = predictionInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return { ok: false, error: parsedInput.error.issues[0]?.message ?? "Invalid prediction" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to submit a prediction" };
  }

  const { error } = await supabase.rpc("submit_prediction", {
    p_match_id: parsedInput.data.matchId,
    p_home_score: parsedInput.data.homeScore,
    p_away_score: parsedInput.data.awayScore,
    p_first_goalscorer_id: parsedInput.data.firstGoalscorerId,
    p_no_goalscorer: parsedInput.data.noGoalscorer,
    p_advanced_team_id: parsedInput.data.advancedTeamId,
    p_confidence_multiplier: parsedInput.data.confidenceMultiplier,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  return { ok: true };
}
