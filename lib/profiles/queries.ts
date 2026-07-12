import type { SupabaseClient } from "@supabase/supabase-js";

export type SelectableTeam = { id: string; name: string; short_name: string; code: string | null; badge_url: string | null; country_code: string | null };

export async function getSelectableTeams(supabase: SupabaseClient): Promise<SelectableTeam[]> {
  const { data: activeTournament } = await supabase.from("tournaments").select("id").eq("is_active", true).order("starts_at", { ascending: false }).limit(1).maybeSingle();
  const { data: configuredTournament } = activeTournament ? { data: null } : await supabase.from("tournaments").select("id").eq("provider", "football-data").eq("sync_enabled", true).order("starts_at", { ascending: false }).limit(1).maybeSingle();
  const tournament = activeTournament ?? configuredTournament;
  let teamIds: string[] = [];
  if (tournament) {
    const { data: matches } = await supabase.from("matches").select("home_team_id,away_team_id").eq("tournament_id", tournament.id);
    teamIds = [...new Set((matches ?? []).flatMap((match) => [match.home_team_id, match.away_team_id]))];
  }
  let query = supabase.from("teams").select("id,name,short_name,code,badge_url,country_code").order("name");
  if (teamIds.length) query = query.in("id", teamIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SelectableTeam[];
}

export async function getProfileForGuard(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("profiles").select("onboarding_completed_at, username, display_name, favorite_team_id").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
