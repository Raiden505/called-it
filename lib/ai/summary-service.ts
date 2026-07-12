import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { performanceSummarySchema, type PerformanceSummary, type SummaryType } from "@/lib/ai/contracts";
import { generateGeminiSummary } from "@/lib/ai/gemini";

type SummaryRow = { content: unknown; created_at: string; input_hash: string; model: string };

export type StoredSummary = { content: PerformanceSummary; createdAt: string; model: string };

export async function getLatestSummary(supabase: SupabaseClient, userId: string, summaryType: SummaryType): Promise<StoredSummary | null> {
  const { data, error } = await supabase.from("ai_summaries").select("content, created_at, input_hash, model").eq("user_id", userId).eq("summary_type", summaryType).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toStoredSummary(data as SummaryRow) : null;
}

export async function getOrCreateSummary(input: {
  adminClient: SupabaseClient;
  userId: string;
  summaryType: SummaryType;
  snapshot: Record<string, unknown>;
}): Promise<{ summary: StoredSummary; cached: boolean }> {
  const inputHash = createHash("sha256").update(JSON.stringify(input.snapshot)).digest("hex");
  const { data: cached, error: cachedError } = await input.adminClient.from("ai_summaries").select("content, created_at, input_hash, model").eq("user_id", input.userId).eq("summary_type", input.summaryType).eq("input_hash", inputHash).maybeSingle();
  if (cachedError) throw new Error(cachedError.message);
  if (cached) return { summary: toStoredSummary(cached as SummaryRow), cached: true };

  const { data: latest, error: latestError } = await input.adminClient.from("ai_summaries").select("created_at").eq("user_id", input.userId).eq("summary_type", input.summaryType).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw new Error(latestError.message);
  if (latest && Date.now() - new Date(latest.created_at).getTime() < 60_000) {
    throw new Error("Please wait a minute before generating another briefing.");
  }

  const generated = await generateGeminiSummary({ type: input.summaryType, snapshot: input.snapshot });
  const { data: stored, error: storeError } = await input.adminClient.from("ai_summaries").insert({ user_id: input.userId, summary_type: input.summaryType, source_snapshot: input.snapshot, input_hash: inputHash, content: generated.content, model: generated.model }).select("content, created_at, input_hash, model").single();
  if (storeError || !stored) throw new Error(storeError?.message ?? "Could not store AI summary");
  return { summary: toStoredSummary(stored as SummaryRow), cached: false };
}

function toStoredSummary(row: SummaryRow): StoredSummary {
  return { content: performanceSummarySchema.parse(row.content), createdAt: row.created_at, model: row.model };
}
