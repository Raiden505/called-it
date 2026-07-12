import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCardRarity } from "@/lib/cards/rarity";

export type ScoredPredictionForCard = {
  id: string;
  userId: string;
  isCalledIt: boolean;
};

type ActiveCard = {
  id: string;
  prediction_id: string;
};

export async function syncCalledItCards(
  adminClient: SupabaseClient,
  input: {
    matchId: string;
    resultVersion: number;
    predictions: ScoredPredictionForCard[];
  },
) {
  const eligiblePredictions = input.predictions.filter((prediction) => prediction.isCalledIt);
  const rarity = getCardRarity(eligiblePredictions.length, input.predictions.length);
  const { data: existingCards, error: existingCardsError } = await adminClient
    .from("called_it_cards")
    .select("id, prediction_id")
    .eq("match_id", input.matchId)
    .is("revoked_at", null);

  if (existingCardsError) {
    throw new Error(existingCardsError.message);
  }

  const activeByPredictionId = new Map(
    ((existingCards ?? []) as ActiveCard[]).map((card) => [card.prediction_id, card]),
  );
  const eligiblePredictionIds = new Set(eligiblePredictions.map((prediction) => prediction.id));
  const revocations = ((existingCards ?? []) as ActiveCard[])
    .filter((card) => !eligiblePredictionIds.has(card.prediction_id));

  for (const card of revocations) {
    const { error } = await adminClient
      .from("called_it_cards")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", card.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  for (const prediction of eligiblePredictions) {
    const existingCard = activeByPredictionId.get(prediction.id);

    if (existingCard) {
      const { error } = await adminClient
        .from("called_it_cards")
        .update({
          rarity: rarity.label,
          rarity_percentage: rarity.percentage,
          result_version: input.resultVersion,
          revoked_at: null,
        })
        .eq("id", existingCard.id);

      if (error) {
        throw new Error(error.message);
      }

      continue;
    }

    const publicSlug = `called-it-${randomUUID().replaceAll("-", "")}`;
    const { data: card, error: cardError } = await adminClient
      .from("called_it_cards")
      .insert({
        prediction_id: prediction.id,
        user_id: prediction.userId,
        match_id: input.matchId,
        public_slug: publicSlug,
        rarity: rarity.label,
        rarity_percentage: rarity.percentage,
        result_version: input.resultVersion,
      })
      .select("id")
      .single();

    if (cardError || !card) {
      throw new Error(cardError?.message ?? "Could not issue Called It card");
    }

    const { error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        user_id: prediction.userId,
        type: "called_it_earned",
        payload: { cardId: card.id, publicSlug, matchId: input.matchId, resultVersion: input.resultVersion },
      });

    if (notificationError) {
      throw new Error(notificationError.message);
    }
  }
}
