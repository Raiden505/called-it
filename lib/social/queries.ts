import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileSummary = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  favorite_team_id: string | null;
  country_code: string | null;
};

export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
};

export type FriendProfile = ProfileSummary & {
  friendshipId: string;
  relationship: "friend" | "incoming" | "outgoing";
};

export type SearchProfile = ProfileSummary & {
  relationship: "none" | "friend" | "incoming" | "outgoing" | "blocked";
  friendshipId: string | null;
};

export async function getFriendProfiles(supabase: SupabaseClient, userId: string): Promise<{
  friends: FriendProfile[];
  incoming: FriendProfile[];
  outgoing: FriendProfile[];
}> {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !friendships?.length) {
    return { friends: [], incoming: [], outgoing: [] };
  }

  const rows = friendships as FriendshipRow[];
  const profileIds = [...new Set(rows.flatMap((row) => [row.requester_id, row.addressee_id]))].filter((id) => id !== userId);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, favorite_team_id, country_code")
    .in("id", profileIds);

  const profileMap = new Map((profiles as ProfileSummary[] | null ?? []).map((profile) => [profile.id, profile]));
  const result = { friends: [] as FriendProfile[], incoming: [] as FriendProfile[], outgoing: [] as FriendProfile[] };

  for (const row of rows) {
    const otherUserId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    const profile = profileMap.get(otherUserId);
    if (!profile || row.status === "rejected") {
      continue;
    }

    const relationship = row.status === "accepted"
      ? "friend"
      : row.requester_id === userId ? "outgoing" : "incoming";
    result[relationship === "friend" ? "friends" : relationship].push({ ...profile, friendshipId: row.id, relationship });
  }

  return result;
}

export async function searchProfiles(
  supabase: SupabaseClient,
  userId: string,
  query: string,
): Promise<SearchProfile[]> {
  const searchTerm = query.trim().replace(/[%_\\]/g, "\\$&").slice(0, 40);
  if (!searchTerm) {
    return [];
  }

  const pattern = `%${searchTerm}%`;
  const [{ data: usernameMatches }, { data: displayNameMatches }, { data: friendships }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, favorite_team_id, country_code").neq("id", userId).eq("is_searchable", true).ilike("username", pattern).limit(20),
    supabase.from("profiles").select("id, username, display_name, avatar_url, favorite_team_id, country_code").neq("id", userId).eq("is_searchable", true).ilike("display_name", pattern).limit(20),
    supabase.from("friendships").select("id, requester_id, addressee_id, status").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);

  const profileMap = new Map<string, ProfileSummary>();
  for (const profile of [...(usernameMatches ?? []), ...(displayNameMatches ?? [])] as ProfileSummary[]) {
    profileMap.set(profile.id, profile);
  }

  const relationshipMap = new Map<string, FriendshipRow>();
  for (const friendship of friendships as FriendshipRow[] | null ?? []) {
    relationshipMap.set(friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id, friendship);
  }

  return [...profileMap.values()].map((profile) => {
    const friendship = relationshipMap.get(profile.id);
    let relationship: SearchProfile["relationship"] = "none";
    if (friendship?.status === "accepted") relationship = "friend";
    if (friendship?.status === "blocked") relationship = "blocked";
    if (friendship?.status === "pending") relationship = friendship.requester_id === userId ? "outgoing" : "incoming";
    return { ...profile, relationship, friendshipId: friendship?.id ?? null };
  });
}
