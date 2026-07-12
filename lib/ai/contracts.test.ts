import { describe, expect, it } from "vitest";
import { performanceSummarySchema } from "@/lib/ai/contracts";

describe("performanceSummarySchema", () => {
  it("accepts the grounded structured summary format", () => {
    expect(performanceSummarySchema.parse({
      headline: "Three perfect calls, one sharp run.",
      summary: "Your recent scored predictions are producing points consistently.",
      strengths: ["Exact-score calls"],
      improvementAreas: ["Use high confidence sparingly"],
      factualHighlights: ["3 Called It cards", "100% correct outcomes"],
    })).toEqual({
      headline: "Three perfect calls, one sharp run.",
      summary: "Your recent scored predictions are producing points consistently.",
      strengths: ["Exact-score calls"],
      improvementAreas: ["Use high confidence sparingly"],
      factualHighlights: ["3 Called It cards", "100% correct outcomes"],
    });
  });

  it("rejects overly long or unstructured model output", () => {
    expect(() => performanceSummarySchema.parse({
      headline: "x".repeat(81),
      summary: "A summary",
      strengths: [],
      improvementAreas: [],
      factualHighlights: [],
    })).toThrow();
  });
});
