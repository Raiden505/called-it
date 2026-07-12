import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FootballDataClient } from "@/lib/sports/providers/football-data/client";
import { FootballDataProvider } from "@/lib/sports/providers/football-data/provider";
import { syncDueWork } from "@/lib/sports/due-work-service";

export async function POST(request: Request) {
  const expected = process.env.SPORTS_CRON_SECRET ?? process.env.ADMIN_SYNC_SECRET;
  const provided = request.headers.get("x-sports-cron-secret");
  if (!expected || !provided || !secretsMatch(provided, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.FOOTBALL_DATA_API_TOKEN; const competition = process.env.FOOTBALL_DATA_COMPETITION; const season = process.env.FOOTBALL_DATA_SEASON;
  if (!token || !competition || !season) return NextResponse.json({ error: "Sports sync configuration is incomplete" }, { status: 503 });
  let dryRun = false; try { dryRun = Boolean((await request.json()).dryRun); } catch { /* Empty cron body is valid. */ }
  if (process.env.SPORTS_SYNC_ENABLED !== "true" && !dryRun) return NextResponse.json({ error: "Sports sync is disabled" }, { status: 503 });
  const client = createAdminClient(); const holderId = randomUUID(); const leaseKey = "due-work:football-data";
  try {
    if (!dryRun) {
      const { data, error } = await client.rpc("acquire_sports_sync_lease", { p_lease_key: leaseKey, p_holder_id: holderId, p_ttl_seconds: 120 });
      if (error) throw new Error(`Could not acquire cron lease: ${error.message}`);
      if (data !== true) return NextResponse.json({ error: "Sports cron already running" }, { status: 409 });
    }
    const provider = new FootballDataProvider(new FootballDataClient({ token, baseUrl: process.env.FOOTBALL_DATA_BASE_URL }));
    const result = await syncDueWork({ adminClient: client, provider, competition: { codeOrId: competition, season }, dryRun });
    return NextResponse.json(result);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled sports sync failed" }, { status: 502 }); }
  finally { if (!dryRun) await client.from("sports_sync_leases").delete().eq("lease_key", leaseKey).eq("holder_id", holderId); }
}

function secretsMatch(provided: string, expected: string) { const left = Buffer.from(provided); const right = Buffer.from(expected); return left.length === right.length && timingSafeEqual(left, right); }
