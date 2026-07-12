"use server";

import { revalidatePath } from "next/cache";
import { postgresUuidSchema } from "@/lib/validation/postgres";
import { createClient } from "@/lib/supabase/server";

export type CardVisibilityState = { ok: boolean; message: string };

export async function updateCardVisibility(_: CardVisibilityState, formData: FormData): Promise<CardVisibilityState> {
  const parsedCardId = postgresUuidSchema.safeParse(formData.get("cardId"));
  const isPublic = formData.get("isPublic") === "true";

  if (!parsedCardId.success) {
    return { ok: false, message: "Invalid card." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_called_it_card_visibility", { p_card_id: parsedCardId.data, p_is_public: isPublic });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/cards/[publicSlug]", "page");
  return { ok: true, message: isPublic ? "Card is public." : "Card link disabled." };
}
