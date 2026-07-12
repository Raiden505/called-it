import { describe, expect, it } from "vitest";
import { countryOptions, getCountryOption } from "@/lib/countries";

describe("country options", () => {
  it("provides searchable names and stable ISO codes", () => {
    expect(getCountryOption("pk")).toEqual({ code: "PK", name: "Pakistan" });
    expect(countryOptions.some((country) => country.name === "United States" && country.code === "US")).toBe(true);
  });
});
