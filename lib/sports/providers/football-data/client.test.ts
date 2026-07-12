import { describe, expect, it } from "vitest";
import { FootballDataClient } from "@/lib/sports/providers/football-data/client";

const validMatch = { id: 1, utcDate: "2026-07-11T15:00:00Z", status: "FINISHED", stage: "REGULAR_SEASON", lastUpdated: null, competition: { id: 2000 }, season: { startDate: "2026-01-01", endDate: "2026-12-31" }, homeTeam: { id: 1, name: "Home", shortName: "Home", tla: "HOM", crest: null, area: { code: "INT" } }, awayTeam: { id: 2, name: "Away", shortName: "Away", tla: "AWA", crest: null, area: { code: "INT" } }, score: { duration: "REGULAR", winner: "HOME", fullTime: { home: 1, away: 0 }, halfTime: { home: 1, away: 0 } }, goals: [] };

describe("football-data client", () => {
  it("retries transient failures and sends provider headers", async () => {
    let calls = 0;
    const client = new FootballDataClient({ token: "test-token", baseUrl: "https://example.test", sleep: async () => undefined, fetchImpl: async (_input, init) => { calls++; expect(new Headers(init?.headers).get("X-Auth-Token")).toBe("test-token"); return calls === 1 ? new Response("busy", { status: 503 }) : new Response(JSON.stringify({ matches: [validMatch] }), { status: 200, headers: { "content-type": "application/json" } }); } });
    await expect(client.getMatches("/matches")).resolves.toHaveLength(1);
    expect(calls).toBe(2);
  });

  it("does not retry permanent authentication failures", async () => {
    let calls = 0;
    const client = new FootballDataClient({ token: "bad-token", sleep: async () => undefined, fetchImpl: async () => { calls++; return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }); } });
    await expect(client.getMatches("/matches")).rejects.toThrow("401");
    expect(calls).toBe(1);
  });

  it("rejects malformed provider payloads", async () => {
    const client = new FootballDataClient({ token: "test-token", sleep: async () => undefined, fetchImpl: async () => new Response(JSON.stringify({ matches: [{ id: "not-a-number" }] }), { status: 200 }) });
    await expect(client.getMatches("/matches")).rejects.toThrow();
  });
});
