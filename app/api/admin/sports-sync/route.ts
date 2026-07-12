import { timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FootballDataClient } from "@/lib/sports/providers/football-data/client";
import { FootballDataProvider } from "@/lib/sports/providers/football-data/provider";
import { syncCompetition } from "@/lib/sports/sync-service";

export async function POST(request: Request) {
  const expectedSecret = process.env.ADMIN_SYNC_SECRET;
  const providedSecret = request.headers.get("x-admin-sync-secret");
  if (!expectedSecret || !providedSecret || !secretsMatch(providedSecret, expectedSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  const competition = process.env.FOOTBALL_DATA_COMPETITION;
  const season = process.env.FOOTBALL_DATA_SEASON;
  if (!token || !competition || !season) return NextResponse.json({ error: "Football-data.org configuration is incomplete" }, { status: 503 });
  let dryRun = false;
  try { dryRun = Boolean((await request.json()).dryRun); } catch { /* Empty request bodies are normal for a real sync. */ }
  const adminClient = createAdminClient();
  const leaseHolder = randomUUID();
  const leaseKey = `competition:${competition}:${season}`;
  try {
    if (!dryRun) {
      const { data: acquired, error: leaseError } = await adminClient.rpc("acquire_sports_sync_lease", { p_lease_key: leaseKey, p_holder_id: leaseHolder, p_ttl_seconds: 300 });
      if (leaseError) throw new Error(`Could not acquire sports sync lease: ${leaseError.message}`);
      if (acquired !== true) return NextResponse.json({ error: "Sports sync already running" }, { status: 409 });
    }
    const provider = new FootballDataProvider(new FootballDataClient({ token, baseUrl: process.env.FOOTBALL_DATA_BASE_URL }));
    const summary = await syncCompetition({ adminClient, provider, competition: { codeOrId: competition, season }, triggerType: "admin", syncSquads: process.env.FOOTBALL_DATA_SYNC_SQUADS === "true", dryRun });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sports sync failed" }, { status: 502 });
  } finally {
    if (!dryRun) await adminClient.from("sports_sync_leases").delete().eq("lease_key", leaseKey).eq("holder_id", leaseHolder);
  }
}

function secretsMatch(providedSecret: string, expectedSecret: string) { const provided = Buffer.from(providedSecret); const expected = Buffer.from(expectedSecret); return provided.length === expected.length && timingSafeEqual(provided, expected); }
