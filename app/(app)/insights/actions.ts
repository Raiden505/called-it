"use server";

import { revalidatePath } from "next/cache";
import type { PerformanceSummary } from "@/lib/ai/contracts";
import { GeminiNotConfiguredError } from "@/lib/ai/gemini";
import { buildFriendsSnapshot, buildPersonalSnapshot } from "@/lib/ai/snapshots";
import { getOrCreateSummary } from "@/lib/ai/summary-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InsightActionState = { ok: boolean; message: string; summary?: PerformanceSummary };

export async function generatePersonalInsight(previousState: InsightActionState, formData: FormData): Promise<InsightActionState> {
  void previousState;
  void formData;
  return generateInsight("personal_performance");
}

export async function generateFriendsInsight(previousState: InsightActionState, formData: FormData): Promise<InsightActionState> {
  void previousState;
  void formData;
  return generateInsight("friends_recap");
}

async function generateInsight(summaryType: "personal_performance" | "friends_recap"): Promise<InsightActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to generate a briefing." };

  try {
    const result = summaryType === "personal_performance"
      ? await getOrCreateSummary({ adminClient: createAdminClient(), userId: user.id, summaryType, snapshot: await buildPersonalSnapshot(supabase, user.id) })
      : await generateFriendsRecap(supabase, user.id);
    revalidatePath(summaryType === "personal_performance" ? "/profile" : "/leaderboard");
    return { ok: true, message: result.cached ? "Loaded your latest briefing." : "Briefing ready.", summary: result.summary.content };
  } catch (error) {
    if (error instanceof GeminiNotConfiguredError) {
      return { ok: false, message: "The AI briefing is not configured yet. Your verified statistics are still available." };
    }
    console.error("AI summary generation failed", error instanceof Error ? error.message : "Unknown error");
    return { ok: false, message: "The briefing could not be generated. Please try again shortly." };
  }
}

async function generateFriendsRecap(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const snapshot = await buildFriendsSnapshot(supabase, userId);
  if (snapshot.friendCount === 0) {
    throw new Error("Add an accepted friend before generating a friends recap.");
  }
  return getOrCreateSummary({ adminClient: createAdminClient(), userId, summaryType: "friends_recap", snapshot });
}
