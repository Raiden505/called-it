import type { SupabaseClient } from "@supabase/supabase-js";

type CardRow = {
  id: string;
  prediction_id: string;
  user_id: string;
  public_slug: string;
  rarity: "Legendary" | "Elite" | "Rare" | "Verified";
  rarity_percentage: number | string;
  is_public: boolean;
  issued_at: string;
};

type PredictionRow = {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_no_goalscorer: boolean;
  confidence_multiplier: 1 | 2 | 3;
};

type MatchRow = {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  stage: string;
  kickoff_at: string;
  home_score_90: number | null;
  away_score_90: number | null;
  first_goalscorer_id: string | null;
};

type TeamRow = { id: string; name: string; short_name: string; badge_url: string | null; country_code: string | null };
type TournamentRow = { id: string; name: string };
type PlayerRow = { id: string; name: string; photo_url: string | null };
type ProfileRow = { id: string; display_name: string; avatar_url: string | null; country_code: string | null };

export type CalledItCardView = {
  id: string;
  publicSlug: string;
  rarity: CardRow["rarity"];
  rarityPercentage: number;
  isPublic: boolean;
  issuedAt: string;
  predictor: { displayName: string; avatarUrl: string | null; countryCode: string | null };
  tournamentName: string;
  stage: string;
  kickoffAt: string;
  homeTeam: TeamRow;
  awayTeam: TeamRow;
  predictedHomeScore: number;
  predictedAwayScore: number;
  actualHomeScore: number;
  actualAwayScore: number;
  firstGoalscorerName: string;
  firstGoalscorerPhotoUrl: string | null;
  confidenceMultiplier: 1 | 2 | 3;
};

export async function getOwnCalledItCards(supabase: SupabaseClient, userId: string): Promise<CalledItCardView[]> {
  const { data, error } = await supabase
    .from("called_it_cards")
    .select("id, prediction_id, user_id, public_slug, rarity, rarity_percentage, is_public, issued_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateCards(supabase, (data ?? []) as CardRow[]);
}

export async function getPublicCalledItCard(supabase: SupabaseClient, publicSlug: string): Promise<CalledItCardView | null> {
  const { data, error } = await supabase
    .from("called_it_cards")
    .select("id, prediction_id, user_id, public_slug, rarity, rarity_percentage, is_public, issued_at")
    .eq("public_slug", publicSlug)
    .eq("is_public", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (await hydrateCards(supabase, data ? [data as CardRow] : []))[0] ?? null;
}

async function hydrateCards(supabase: SupabaseClient, cards: CardRow[]): Promise<CalledItCardView[]> {
  if (!cards.length) {
    return [];
  }

  const cardIds = cards.map((card) => card.prediction_id);
  const { data: predictionData, error: predictionError } = await supabase
    .from("predictions")
    .select("id, match_id, predicted_home_score, predicted_away_score, predicted_no_goalscorer, confidence_multiplier")
    .in("id", cardIds);

  if (predictionError) {
    throw new Error(predictionError.message);
  }

  const predictions = (predictionData ?? []) as PredictionRow[];
  const predictionById = new Map(predictions.map((prediction) => [prediction.id, prediction]));
  const matchIds = [...new Set(predictions.map((prediction) => prediction.match_id))];
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, tournament_id, home_team_id, away_team_id, stage, kickoff_at, home_score_90, away_score_90, first_goalscorer_id")
    .in("id", matchIds);

  if (matchError) {
    throw new Error(matchError.message);
  }

  const matches = (matchData ?? []) as MatchRow[];
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const tournamentIds = [...new Set(matches.map((match) => match.tournament_id))];
  const scorerIds = [...new Set(matches.flatMap((match) => match.first_goalscorer_id ? [match.first_goalscorer_id] : []))];
  const userIds = [...new Set(cards.map((card) => card.user_id))];

  const [teamResult, tournamentResult, playerResult, profileResult] = await Promise.all([
    supabase.from("teams").select("id, name, short_name, badge_url, country_code").in("id", teamIds),
    supabase.from("tournaments").select("id, name").in("id", tournamentIds),
    scorerIds.length ? supabase.from("players").select("id, name, photo_url").in("id", scorerIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("profiles").select("id, display_name, avatar_url, country_code").in("id", userIds),
  ]);

  if (teamResult.error || tournamentResult.error || playerResult.error || profileResult.error) {
    throw new Error(teamResult.error?.message ?? tournamentResult.error?.message ?? playerResult.error?.message ?? profileResult.error?.message);
  }

  const teamById = new Map(((teamResult.data ?? []) as TeamRow[]).map((team) => [team.id, team]));
  const tournamentById = new Map(((tournamentResult.data ?? []) as TournamentRow[]).map((tournament) => [tournament.id, tournament]));
  const playerById = new Map(((playerResult.data ?? []) as PlayerRow[]).map((player) => [player.id, player]));
  const profileById = new Map(((profileResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));

  return cards.flatMap((card) => {
    const prediction = predictionById.get(card.prediction_id);
    const match = prediction ? matchById.get(prediction.match_id) : undefined;
    const homeTeam = match ? teamById.get(match.home_team_id) : undefined;
    const awayTeam = match ? teamById.get(match.away_team_id) : undefined;
    const tournament = match ? tournamentById.get(match.tournament_id) : undefined;
    const profile = profileById.get(card.user_id);

    if (!prediction || !match || !homeTeam || !awayTeam || !tournament || !profile || match.home_score_90 === null || match.away_score_90 === null) {
      return [];
    }

    return [{
      id: card.id,
      publicSlug: card.public_slug,
      rarity: card.rarity,
      rarityPercentage: Number(card.rarity_percentage),
      isPublic: card.is_public,
      issuedAt: card.issued_at,
      predictor: { displayName: profile.display_name, avatarUrl: profile.avatar_url, countryCode: profile.country_code },
      tournamentName: tournament.name,
      stage: match.stage,
      kickoffAt: match.kickoff_at,
      homeTeam,
      awayTeam,
      predictedHomeScore: prediction.predicted_home_score,
      predictedAwayScore: prediction.predicted_away_score,
      actualHomeScore: match.home_score_90,
      actualAwayScore: match.away_score_90,
      firstGoalscorerName: prediction.predicted_no_goalscorer ? "No goalscorer" : playerById.get(match.first_goalscorer_id ?? "")?.name ?? "First goalscorer",
      firstGoalscorerPhotoUrl: prediction.predicted_no_goalscorer ? null : playerById.get(match.first_goalscorer_id ?? "")?.photo_url ?? null,
      confidenceMultiplier: prediction.confidence_multiplier,
    }];
  });
}
