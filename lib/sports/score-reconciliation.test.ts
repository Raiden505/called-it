import { describe, expect, it } from "vitest";
import { decideScoreReconciliation } from "@/lib/sports/due-work-service";
import type { ResultCandidate } from "@/lib/sports/contracts";

const base: Pick<ResultCandidate, "firstGoalscorerExternalId" | "advancedExternalTeamId"> = { firstGoalscorerExternalId: "p-9", advancedExternalTeamId: "t-3" };

describe("score entity reconciliation", () => {
  it("uses resolved identities when both player and team are mapped", () => {
    const decision = decideScoreReconciliation(base, { firstGoalscorer: "uuid-p", advancedTeam: "uuid-t" });
    expect(decision).toEqual({ firstGoalscorerId: "uuid-p", advancedTeamId: "uuid-t", blocked: false, warningCode: null });
  });

  it("keeps scoring flowing when the first-goalscorer player is not in the database", () => {
    const decision = decideScoreReconciliation(base, { firstGoalscorer: null, advancedTeam: "uuid-t" });
    expect(decision.blocked).toBe(false);
    expect(decision.firstGoalscorerId).toBeNull();
    expect(decision.warningCode).toBe("first_goalscorer_unmapped");
  });

  it("blocks manual review only when the fixture's advancing team itself is unmapped", () => {
    const decision = decideScoreReconciliation(base, { firstGoalscorer: "uuid-p", advancedTeam: null });
    expect(decision.blocked).toBe(true);
    expect(decision.warningCode).toBe("result_entity_unmapped");
  });

  it("treats a null provider scorer as a normal mapped null", () => {
    const decision = decideScoreReconciliation({ firstGoalscorerExternalId: null, advancedExternalTeamId: "t-3" }, { firstGoalscorer: null, advancedTeam: "uuid-t" });
    expect(decision).toEqual({ firstGoalscorerId: null, advancedTeamId: "uuid-t", blocked: false, warningCode: null });
  });

  it("prioritises the unmapped-team block when both entities are unmapped", () => {
    const decision = decideScoreReconciliation(base, { firstGoalscorer: null, advancedTeam: null });
    expect(decision.blocked).toBe(true);
    expect(decision.warningCode).toBe("result_entity_unmapped");
    expect(decision.firstGoalscorerId).toBeNull();
  });
});