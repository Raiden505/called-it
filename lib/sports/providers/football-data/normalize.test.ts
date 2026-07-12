import { describe, expect, it } from "vitest";
import { normalizeMatch } from "@/lib/sports/providers/football-data/normalize";
const team = (id: number, name: string) => ({ id, name, shortName: name, tla: name.slice(0, 3), crest: null, area: { code: "ENG" } });
function fixture(overrides: Record<string, unknown> = {}) { return { id: 10, utcDate: "2026-07-11T15:00:00Z", status: "FINISHED", stage: "REGULAR_SEASON", lastUpdated: null, competition: { id: 202 }, season: { startDate: "2026-01-01", endDate: "2026-12-31" }, homeTeam: team(1, "Home"), awayTeam: team(2, "Away"), score: { duration: "REGULAR", winner: "HOME", fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 } }, goals: [], ...overrides } as never; }
describe("football-data normalizer", () => {
  it("maps regular scores, lifecycle, and winner", () => { const result = normalizeMatch(fixture(), "2026"); expect(result.score90).toEqual({ home: 2, away: 1 }); expect(result.lifecycleStatus).toBe("finished_candidate"); expect(result.winnerExternalTeamId).toBe("1"); });
  it("uses the provider regulation-time score and winner identifiers for knockout results", () => {
    const result = normalizeMatch(fixture({
      score: {
        duration: "EXTRA_TIME",
        winner: "HOME_TEAM",
        fullTime: { home: 3, away: 1 },
        regularTime: { home: 1, away: 1 },
        extraTime: { home: 2, away: 0 },
      },
    }), "2026");

    expect(result.score90).toEqual({ home: 1, away: 1 });
    expect(result.scoreFinal).toEqual({ home: 3, away: 1 });
    expect(result.winnerExternalTeamId).toBe("1");
  });
  it("keeps penalty shootout scores separate and preserves goal order", () => { const result = normalizeMatch(fixture({ status: "PENALTY_SHOOTOUT", score: { duration: "PENALTY_SHOOTOUT", winner: "AWAY", fullTime: { home: 1, away: 1 }, halfTime: { home: 0, away: 0 }, penalties: { home: 3, away: 4 } }, goals: [{ minute: 90, injuryTime: null, type: "REGULAR", team: team(1, "Home"), scorer: { id: 8, name: "Player" } }] }), "2026"); expect(result.lifecycleStatus).toBe("live"); expect(result.scoreFinal).toEqual({ home: 1, away: 1 }); expect(result.penaltyScore).toEqual({ home: 3, away: 4 }); expect(result.events[0].providerEventKey).toContain("REGULAR"); });
  it("marks own goals without inventing a scorer", () => { const result = normalizeMatch(fixture({ status: "IN_PLAY", goals: [{ minute: 12, injuryTime: 1, type: "OWN", team: team(2, "Away"), scorer: null }] }), "2026"); expect(result.events[0].isOwnGoal).toBe(true); expect(result.events[0].playerExternalId).toBeNull(); });
  it("normalizes unfolded lineups and benches into match-player snapshots", () => { const result = normalizeMatch(fixture({ homeTeam: { ...team(1, "Home"), lineup: [{ id: 7, name: "Starter", position: "MIDFIELD" }], bench: [{ id: 8, name: "Sub", position: "OFFENCE" }] }, awayTeam: { ...team(2, "Away"), lineup: [{ id: 9, name: "Away Starter", position: "DEFENCE" }] } }), "2026"); expect(result.matchPlayers).toEqual(expect.arrayContaining([expect.objectContaining({ externalId: "7", teamExternalId: "1", lineupRole: "starter" }), expect.objectContaining({ externalId: "8", teamExternalId: "1", lineupRole: "substitute" }), expect.objectContaining({ externalId: "9", teamExternalId: "2", lineupRole: "starter" })])); });
});
