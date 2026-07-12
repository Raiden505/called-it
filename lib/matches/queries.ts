import type { SupabaseClient } from "@supabase/supabase-js";
import { selectRecentOutcomes } from "@/lib/matches/curation";
import { getResultPresentationState, type ResultPresentationState } from "@/lib/matches/result-presentation";
import type { MatchDeskFilters, ResultsArchiveFilters } from "@/lib/matches/filter-schema";

type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
type ResultProcessingStatus = "not_ready" | "candidate" | "processing" | "processed" | "manual_review" | "failed";

type MatchRow = {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  stage: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score_90: number | null;
  away_score_90: number | null;
  home_score_final: number | null;
  away_score_final: number | null;
  result_version: number;
  result_confirmed_at: string | null;
  result_processed_at: string | null;
  last_synced_at: string | null;
  result_processing_status: ResultProcessingStatus;
};

type TeamRow = { id: string; name: string; short_name: string; code: string | null; badge_url: string | null; country_code: string | null };
type PlayerRow = { id: string; team_id: string; name: string; position: string | null; photo_url: string | null };

export type PredictionViewModel = {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_first_goalscorer_id: string | null;
  predicted_no_goalscorer: boolean;
  confidence_multiplier: 1 | 2 | 3;
  scored_result_version: number | null;
  outcome_points: number;
  goal_difference_points: number;
  exact_score_points: number;
  first_goalscorer_points: number;
  advance_points: number;
  base_points: number;
  total_points: number;
};

type AllocationRow = { multiplier: 1 | 2 | 3; allowed_count: number; used_count: number; tournament_id: string };

export type MatchViewModel = MatchDetailViewModel;

type MatchBaseViewModel = {
  id: string;
  tournamentId: string;
  stage: string;
  kickoffAt: string;
  status: MatchStatus;
  homeTeam: TeamRow;
  awayTeam: TeamRow;
  homeScore: number | null;
  awayScore: number | null;
  lastSyncedAt: string | null;
  resultProcessingStatus: ResultProcessingStatus;
  resultVersion: number;
  resultConfirmedAt: string | null;
  resultProcessedAt: string | null;
  prediction: PredictionViewModel | null;
  resultPresentation: ResultPresentationState;
  multiplierRemaining: Record<2 | 3, number>;
};

export type MatchSummaryViewModel = MatchBaseViewModel & {
  view: "summary";
  players: PlayerRow[];
};

export type MatchDetailViewModel = MatchBaseViewModel & {
  view: "detail";
  players: PlayerRow[];
};

export type MatchDeskData = {
  matches: MatchSummaryViewModel[];
  recentOutcomes: MatchSummaryViewModel[];
  fixtureUpdates: MatchSummaryViewModel[];
  latestSyncedAt: string | null;
};

export type MatchArchivePage = {
  items: MatchSummaryViewModel[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

export type ArchiveTeamOption = { id: string; name: string; short_name: string };

const MATCH_SELECT = "id, tournament_id, home_team_id, away_team_id, stage, kickoff_at, status, home_score_90, away_score_90, home_score_final, away_score_final, result_version, result_confirmed_at, result_processed_at, last_synced_at, result_processing_status";
const PREDICTION_SELECT = "id, match_id, predicted_home_score, predicted_away_score, predicted_first_goalscorer_id, predicted_no_goalscorer, confidence_multiplier, scored_result_version, outcome_points, goal_difference_points, exact_score_points, first_goalscorer_points, advance_points, base_points, total_points";

export async function getMatchDeskForUser(
  supabase: SupabaseClient,
  userId: string,
  filters: MatchDeskFilters = { view: "to-predict", teamId: null },
): Promise<MatchDeskData> {
  let matchRows: MatchRow[] = [];

  if (filters.view === "all") {
    let upcomingQuery = supabase.from("matches").select(MATCH_SELECT).in("status", ["scheduled", "live"]).order("kickoff_at", { ascending: true }).limit(40);
    let recentQuery = supabase.from("matches").select(MATCH_SELECT).in("status", ["finished", "postponed", "cancelled"]).order("kickoff_at", { ascending: false }).limit(40);
    if (filters.teamId) {
      upcomingQuery = upcomingQuery.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
      recentQuery = recentQuery.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
    }
    const [upcomingResult, recentResult] = await Promise.all([upcomingQuery, recentQuery]);
    if (upcomingResult.error || recentResult.error) return { matches: [], recentOutcomes: [], fixtureUpdates: [], latestSyncedAt: null };
    matchRows = [...(upcomingResult.data ?? []), ...(recentResult.data ?? [])] as MatchRow[];
  } else {
    let query = supabase.from("matches").select(MATCH_SELECT).limit(40);
    if (filters.view === "live") query = query.eq("status", "live").order("kickoff_at", { ascending: true });
    else if (filters.view === "recent") query = query.eq("status", "finished").order("kickoff_at", { ascending: false });
    else query = query.in("status", ["scheduled", "live"]).order("kickoff_at", { ascending: true });
    const filteredQuery = filters.teamId ? query.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`) : query;
    const { data, error } = await filteredQuery;
    if (error) return { matches: [], recentOutcomes: [], fixtureUpdates: [], latestSyncedAt: null };
    matchRows = (data ?? []) as MatchRow[];
  }

  if (!matchRows.length) return { matches: [], recentOutcomes: [], fixtureUpdates: [], latestSyncedAt: null };

  const mapped = await hydrateMatches(supabase, userId, matchRows, { includePlayers: true, view: "summary" });
  const filtered = filters.view === "to-predict" ? mapped.filter((match) => !match.prediction && match.status === "scheduled") : filters.view === "my-calls" ? mapped.filter((match) => Boolean(match.prediction)) : mapped;
  const recentCandidates = mapped.map((match) => ({ ...match, hasPrediction: Boolean(match.prediction), lifecycle: match.resultPresentation.key === "scored" ? "scored" as const : match.resultPresentation.key === "recalculating" ? "recalculating" as const : match.resultPresentation.key === "under-review" ? "under-review" as const : "full-time-unconfirmed" as const }));
  const recentOutcomes = selectRecentOutcomes(recentCandidates).items;
  const fixtureUpdates = mapped.filter((match) => match.status === "postponed" || match.status === "cancelled");
  const latestSyncedAt = mapped.map((match) => match.lastSyncedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;

  return { matches: filtered, recentOutcomes, fixtureUpdates, latestSyncedAt };
}

export async function getMatchDetailsForUser(supabase: SupabaseClient, userId: string, matchId: string): Promise<MatchDetailViewModel | null> {
  const { data, error } = await supabase.from("matches").select(MATCH_SELECT).eq("id", matchId).maybeSingle();
  if (error || !data) return null;
  const [match] = await hydrateMatches(supabase, userId, [data as MatchRow], { includePlayers: true, view: "detail" });
  return match ? { ...match, view: "detail" } : null;
}

export async function getResultsArchiveForUser(
  supabase: SupabaseClient,
  userId: string,
  options: { page?: number; pageSize?: number; filters?: ResultsArchiveFilters } = {},
): Promise<MatchArchivePage> {
  const filters = options.filters ?? { scope: "mine", teamId: null, stage: null, from: null, to: null, processing: "all" };
  const { page, pageSize, from, to } = getArchivePageWindow(options.page, options.pageSize);
  let matchQuery = supabase.from("matches").select(MATCH_SELECT).in("status", ["finished", "postponed", "cancelled"]);

  if (filters.scope === "mine") {
    const { data: predictionMatches, error: predictionError } = await supabase.from("predictions").select("match_id").eq("user_id", userId);
    if (predictionError || !predictionMatches?.length) return { items: [], page, pageSize, hasNextPage: false };
    matchQuery = matchQuery.in("id", predictionMatches.map((prediction) => prediction.match_id));
  }
  if (filters.teamId) matchQuery = matchQuery.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
  if (filters.stage) matchQuery = matchQuery.eq("stage", filters.stage);
  if (filters.processing === "pending") matchQuery = matchQuery.in("result_processing_status", ["not_ready", "candidate", "processing"]);
  else if (filters.processing !== "all") matchQuery = matchQuery.eq("result_processing_status", filters.processing);
  if (isIsoDate(filters.from)) matchQuery = matchQuery.gte("kickoff_at", `${filters.from}T00:00:00.000Z`);
  if (isIsoDate(filters.to)) matchQuery = matchQuery.lte("kickoff_at", `${filters.to}T23:59:59.999Z`);

  const { data, error } = await matchQuery.order("kickoff_at", { ascending: false }).order("id", { ascending: false }).range(from, to);
  if (error || !data?.length) return { items: [], page, pageSize, hasNextPage: false };
  const items = await hydrateMatches(supabase, userId, data.slice(0, pageSize) as MatchRow[], { includePlayers: false, view: "summary" });
  return { items, page, pageSize, hasNextPage: data.length > pageSize };
}

export async function getArchiveTeamOptions(supabase: SupabaseClient): Promise<ArchiveTeamOption[]> {
  const { data, error } = await supabase.from("teams").select("id, name, short_name").order("name", { ascending: true }).limit(100);
  if (error) return [];
  return (data ?? []) as ArchiveTeamOption[];
}

export function getArchivePageWindow(requestedPage = 1, requestedPageSize = 20) {
  const page = Math.max(1, Math.floor(requestedPage));
  const pageSize = Math.min(50, Math.max(1, Math.floor(requestedPageSize)));
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize };
}

export async function getMatchesForUser(supabase: SupabaseClient, userId: string): Promise<MatchViewModel[]> {
  const desk = await getMatchDeskForUser(supabase, userId, { view: "all", teamId: null });
  return desk.matches.map((match) => ({ ...match, view: "detail" }));
}

async function hydrateMatches(
  supabase: SupabaseClient,
  userId: string,
  matchRows: MatchRow[],
  options: { includePlayers: boolean; view: "summary" | "detail" },
): Promise<MatchSummaryViewModel[]> {
  const teamIds = [...new Set(matchRows.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const matchIds = matchRows.map((match) => match.id);
  const tournamentIds = [...new Set(matchRows.map((match) => match.tournament_id))];
  const playerTeamIds = options.includePlayers ? [...new Set(matchRows.filter((match) => match.status === "scheduled").flatMap((match) => [match.home_team_id, match.away_team_id]))] : [];

  const [{ data: teams }, { data: players }, { data: predictions }, { data: allocations }] = await Promise.all([
    supabase.from("teams").select("id, name, short_name, code, badge_url, country_code").in("id", teamIds),
    playerTeamIds.length ? supabase.from("players").select("id, team_id, name, position, photo_url").in("team_id", playerTeamIds).order("name") : Promise.resolve({ data: [], error: null }),
    supabase.from("predictions").select(PREDICTION_SELECT).eq("user_id", userId).in("match_id", matchIds),
    supabase.from("confidence_allocations").select("multiplier, allowed_count, used_count, tournament_id").eq("user_id", userId).in("tournament_id", tournamentIds),
  ]);

  const teamMap = new Map((teams as TeamRow[] | null ?? []).map((team) => [team.id, team]));
  const predictionMap = new Map((predictions as PredictionViewModel[] | null ?? []).map((prediction) => [prediction.match_id, prediction]));
  const allocationMap = new Map<string, AllocationRow[]>();
  for (const allocation of allocations as AllocationRow[] | null ?? []) allocationMap.set(allocation.tournament_id, [...(allocationMap.get(allocation.tournament_id) ?? []), allocation]);

  return matchRows.flatMap((match) => {
    const homeTeam = teamMap.get(match.home_team_id);
    const awayTeam = teamMap.get(match.away_team_id);
    if (!homeTeam || !awayTeam) return [];
    const prediction = predictionMap.get(match.id) ?? null;
    const base = {
      id: match.id,
      tournamentId: match.tournament_id,
      stage: match.stage,
      kickoffAt: match.kickoff_at,
      status: match.status,
      homeTeam,
      awayTeam,
      homeScore: match.status === "finished" ? match.home_score_final ?? match.home_score_90 : null,
      awayScore: match.status === "finished" ? match.away_score_final ?? match.away_score_90 : null,
      lastSyncedAt: match.last_synced_at,
      resultProcessingStatus: match.result_processing_status,
      resultVersion: match.result_version,
      resultConfirmedAt: match.result_confirmed_at,
      resultProcessedAt: match.result_processed_at,
      prediction,
      resultPresentation: getResultPresentationState({ status: match.status, resultProcessingStatus: match.result_processing_status, resultVersion: match.result_version, scoredResultVersion: prediction?.scored_result_version ?? null, totalPoints: prediction?.total_points ?? 0, hasPrediction: Boolean(prediction) }),
      multiplierRemaining: {
        2: remainingMultiplierCount(allocationMap.get(match.tournament_id) ?? [], 2, prediction),
        3: remainingMultiplierCount(allocationMap.get(match.tournament_id) ?? [], 3, prediction),
      } as Record<2 | 3, number>,
      players: (players as PlayerRow[] | null ?? []).filter((player) => player.team_id === match.home_team_id || player.team_id === match.away_team_id),
      view: options.view,
    };
    return [base as MatchSummaryViewModel];
  });
}

function remainingMultiplierCount(allocations: AllocationRow[], multiplier: 2 | 3, prediction: PredictionViewModel | null): number {
  const allocation = allocations.find((item) => item.multiplier === multiplier);
  const allowance = allocation?.allowed_count ?? (multiplier === 2 ? 3 : 1);
  const used = allocation?.used_count ?? 0;
  return Math.max(0, allowance - used + (prediction?.confidence_multiplier === multiplier ? 1 : 0));
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
