import { describe, expect, it } from "vitest";

import {
  fmtDayMonth,
  fmtDisplayDate,
  fmtInr,
  fmtInrCrore,
  fmtMoney,
  fmtNumber,
  fmtPercent,
  signTone,
} from "@/lib/format";

describe("number formatters (pinned en-IN)", () => {
  it("uses lakh/crore grouping deterministically", () => {
    expect(fmtMoney(1234567.5)).toBe("12,34,567.50");
    expect(fmtNumber(1234567, 0)).toBe("12,34,567");
    expect(fmtInr(100000, 0)).toBe("₹1,00,000");
  });

  it("expresses rupee amounts in crores to three decimals", () => {
    expect(fmtInrCrore(159461)).toBe("₹0.016 Cr");
    expect(fmtInrCrore(400000)).toBe("₹0.040 Cr");
    expect(fmtInrCrore(0)).toBe("₹0.000 Cr");
  });

  it("renders a dash for non-finite values", () => {
    expect(fmtMoney(Number.NaN)).toBe("-");
    expect(fmtInr(Infinity)).toBe("-");
    expect(fmtPercent(Number.NaN)).toBe("-");
    expect(fmtInrCrore(Number.NaN)).toBe("-");
  });

  it("formats fractions as percentages", () => {
    expect(fmtPercent(0.1603, 1)).toBe("16.0%");
    expect(fmtPercent(-0.25, 0)).toBe("-25%");
  });
});

describe("date formatters", () => {
  it("renders dd-mm-yyyy and dd Mon", () => {
    expect(fmtDisplayDate("2026-07-17")).toBe("17-07-2026");
    expect(fmtDayMonth("2026-07-17")).toBe("17 Jul");
  });

  it("passes through unparseable input", () => {
    expect(fmtDisplayDate("not-a-date")).toBe("not-a-date");
    expect(fmtDisplayDate("")).toBe("-");
  });
});

describe("signTone", () => {
  it("is NaN-safe (missing values must not look negative)", () => {
    expect(signTone(5)).toBe("positive");
    expect(signTone(0)).toBe("positive");
    expect(signTone(-1)).toBe("negative");
    expect(signTone(Number.NaN)).toBe("default");
  });
});
