import { describe, expect, it } from "vitest";
import { getArchivePageWindow } from "@/lib/matches/queries";

describe("results archive pagination", () => {
  it("uses twenty rows and a stable extra-row window by default", () => {
    expect(getArchivePageWindow()).toEqual({ page: 1, pageSize: 20, from: 0, to: 20 });
    expect(getArchivePageWindow(3, 20)).toEqual({ page: 3, pageSize: 20, from: 40, to: 60 });
  });

  it("clamps unsafe page values and page sizes", () => {
    expect(getArchivePageWindow(0, 500)).toEqual({ page: 1, pageSize: 50, from: 0, to: 50 });
    expect(getArchivePageWindow(-4, 0)).toEqual({ page: 1, pageSize: 1, from: 0, to: 1 });
  });
});
