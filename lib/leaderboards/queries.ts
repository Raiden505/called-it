import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardScope = "global" | "friends";

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  username: string | null;
  favorite_team_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  favorite_team_badge_url: string | null;
  total_points: number;
  exact_scores: number;
  called_it_cards: number;
  current_streak: number;
  correct_outcomes: number;
  correct_first_goalscorers: number;
  predictions_made: number;
  accuracy: number;
};

export type ProfileStats = {
  global_rank: number;
  friends_rank: number | null;
  total_points: number;
  predictions_made: number;
  correct_outcomes: number;
  correct_first_goalscorers: number;
  exact_scores: number;
  called_it_cards: number;
  current_streak: number;
  accuracy: number;
  average_points: number;
};

export async function getLeaderboard(supabase: SupabaseClient, scope: LeaderboardScope): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_scope: scope, p_limit: 100 });
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as LeaderboardRow[];
  if (!rows.length) return rows;
  const userIds = rows.map((row) => row.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, avatar_url, country_code, favorite_team_id").in("id", userIds);
  const profileRows = (profiles ?? []) as { id: string; avatar_url: string | null; country_code: string | null; favorite_team_id: string | null }[];
  const teamIds = [...new Set(profileRows.flatMap((profile) => profile.favorite_team_id ? [profile.favorite_team_id] : []))];
  const { data: teams } = teamIds.length ? await supabase.from("teams").select("id, badge_url").in("id", teamIds) : { data: [] };
  const teamMap = new Map((teams ?? []).map((team) => [team.id, team.badge_url as string | null]));
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));
  return rows.map((row) => { const profile = profileMap.get(row.user_id); return { ...row, avatar_url: profile?.avatar_url ?? null, country_code: profile?.country_code ?? null, favorite_team_badge_url: profile?.favorite_team_id ? teamMap.get(profile.favorite_team_id) ?? null : null }; });
}

export async function getProfileStats(supabase: SupabaseClient, userId: string): Promise<ProfileStats | null> {
  const { data, error } = await supabase.rpc("get_profile_stats", { p_profile_id: userId });
  if (error) {
    throw new Error(error.message);
  }
  return (data?.[0] as ProfileStats | undefined) ?? null;
}

export async function getCurrentProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, favorite_team_id, country_code, bio")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getTeamById(supabase: SupabaseClient, teamId: string | null) {
  if (!teamId) return null;
  const { data, error } = await supabase.from("teams").select("id, name, short_name, code, badge_url, country_code").eq("id", teamId).maybeSingle();
  if (error) return null;
  return data;
}
