import { describe, expect, it } from "vitest";
import { getCardRarity } from "@/lib/cards/rarity";

describe("getCardRarity", () => {
  it("marks a one-percent Called It prediction as legendary", () => {
    expect(getCardRarity(1, 100)).toEqual({ label: "Legendary", percentage: 1 });
  });

  it("uses the eligible share of scored predictions and rounds it for display", () => {
    expect(getCardRarity(2, 27)).toEqual({ label: "Rare", percentage: 7.4 });
  });

  it("handles an empty scored-prediction set defensively", () => {
    expect(getCardRarity(0, 0)).toEqual({ label: "Verified", percentage: 0 });
  });
});
