import { describe, expect, it } from "vitest";
import { countryFlagUrl, initials, isAllowedImageUrl, normalizeCountryCode } from "@/lib/media";

describe("media helpers", () => {
  it("normalizes valid ISO country codes and rejects invalid values", () => {
    expect(normalizeCountryCode(" PK ")).toBe("pk");
    expect(normalizeCountryCode("GB")).toBe("gb");
    expect(normalizeCountryCode("PAK")).toBeNull();
    expect(countryFlagUrl("PK")).toBe("https://flagcdn.com/24x18/pk.png");
    expect(countryFlagUrl("??")).toBeNull();
  });

  it("creates compact initials for media fallbacks", () => {
    expect(initials("Called It")).toBe("CI");
    expect(initials("France")).toBe("F");
    expect(initials(null, "TM")).toBe("TM");
  });

  it("allows only approved HTTPS image hosts", () => {
    expect(isAllowedImageUrl("https://crests.football-data.org/57.png")).toBe(true);
    expect(isAllowedImageUrl("https://flagcdn.com/24x18/pk.png")).toBe(true);
    expect(isAllowedImageUrl("https://example.com/avatar.png")).toBe(false);
    expect(isAllowedImageUrl("javascript:alert(1)")).toBe(false);
  });
});
