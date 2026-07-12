import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validation/profile";

describe("profile validation", () => {
  it("normalizes valid profile identity fields", () => {
    const result = profileSchema.parse({ username: "  captain_ayaan ", displayName: "  Ayaan  ", favoriteTeamId: "11111111-1111-4111-8111-111111111111", countryCode: "pk", bio: "Calls before kickoff.", isSearchable: true, profileVisibility: "public" });
    expect(result.username).toBe("captain_ayaan"); expect(result.displayName).toBe("Ayaan"); expect(result.countryCode).toBe("PK");
  });
  it("rejects punctuation and invalid team IDs", () => {
    expect(profileSchema.safeParse({ username: "Captain Ayaan", displayName: "Ayaan", favoriteTeamId: "not-a-uuid", countryCode: null, bio: null, isSearchable: true, profileVisibility: "public" }).success).toBe(false);
  });
});
