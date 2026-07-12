"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postgresUuidSchema } from "@/lib/validation/postgres";

export type FriendshipActionState = { ok: boolean; message: string };

const successState: FriendshipActionState = { ok: true, message: "Done" };

export async function sendFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  const addresseeId = postgresUuidSchema.safeParse(formData.get("addresseeId"));
  if (!addresseeId.success) {
    return { ok: false, message: "That profile could not be found" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to add friends" };

  const { error } = await supabase.rpc("send_friend_request", { p_addressee_id: addresseeId.data });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/friends");
  revalidatePath("/leaderboard");
  return successState;
}

export async function resolveFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  const friendshipId = postgresUuidSchema.safeParse(formData.get("friendshipId"));
  const action = formData.get("action");
  if (!friendshipId.success || typeof action !== "string" || !["accept", "reject", "cancel", "remove", "block"].includes(action)) {
    return { ok: false, message: "Invalid friendship action" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to manage friends" };

  const { error } = await supabase.rpc("resolve_friend_request", { p_friendship_id: friendshipId.data, p_action: action });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/friends");
  revalidatePath("/leaderboard");
  return successState;
}

