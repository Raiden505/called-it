"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSelectableTeams } from "@/lib/profiles/queries";
import { profileSchema } from "@/lib/validation/profile";

export type ProfileFormState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };

export async function saveProfile(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const raw = {
    username: String(formData.get("username") ?? ""), displayName: String(formData.get("displayName") ?? ""), favoriteTeamId: String(formData.get("favoriteTeamId") ?? ""),
    countryCode: String(formData.get("countryCode") ?? "").trim() || null, bio: String(formData.get("bio") ?? "").trim() || null,
    isSearchable: formData.has("isSearchable") ? formData.get("isSearchable") === "on" : true, profileVisibility: String(formData.get("profileVisibility") ?? "public"),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired. Sign in again." };
  const teams = await getSelectableTeams(supabase);
  if (!teams.some((team) => team.id === parsed.data.favoriteTeamId)) return { ok: false, message: "Choose a team from the active competition.", fieldErrors: { favoriteTeamId: ["Choose a team from the active competition."] } };
  const { error } = await supabase.from("profiles").update({ username: parsed.data.username, display_name: parsed.data.displayName, favorite_team_id: parsed.data.favoriteTeamId, country_code: parsed.data.countryCode, bio: parsed.data.bio, is_searchable: parsed.data.isSearchable, profile_visibility: parsed.data.profileVisibility }).eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "That username is already taken.", fieldErrors: { username: ["Choose another username."] } };
    return { ok: false, message: "We could not save your profile right now." };
  }
  revalidatePath("/profile"); revalidatePath("/leaderboard"); revalidatePath("/friends"); revalidatePath("/dashboard");
  if (formData.get("mode") === "onboarding") {
    const requestedNext = String(formData.get("next") ?? "");
    const nextPath = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
    redirect(nextPath as never);
  }
  return { ok: true, message: "Profile saved." };
}
