import { describe, expect, it } from "vitest";

import { daysBetween, financialsWithGrowth, gmpForecast, gmpStats, niceScale } from "@/lib/ipo/analytics";
import { makeFinancialRow, makeGmpRow } from "@/lib/ipo/defaults";

describe("financialsWithGrowth", () => {
  it("computes YoY growth from a positive base", () => {
    const rows = financialsWithGrowth([
      makeFinancialRow({ period: "Mar'24", totalAssets: 100, grossRevenue: 200, pat: 50 }),
      makeFinancialRow({ period: "Mar'25", totalAssets: 110, grossRevenue: 260, pat: 40 }),
    ]);
    expect(rows[1]!.assetGrowth).toBeCloseTo(0.1);
    expect(rows[1]!.revenueGrowth).toBeCloseTo(0.3);
    expect(rows[1]!.patGrowth).toBeCloseTo(-0.2);
  });

  it("returns NaN (not a sign-flipped figure) when the base is zero or negative", () => {
    const rows = financialsWithGrowth([
      makeFinancialRow({ period: "Mar'24", totalAssets: 100, grossRevenue: 0, pat: -10 }),
      makeFinancialRow({ period: "Mar'25", totalAssets: 120, grossRevenue: 50, pat: 5 }),
    ]);
    // Loss of 10 -> profit of 5 is an improvement; the old formula reported -150%.
    expect(Number.isNaN(rows[1]!.patGrowth)).toBe(true);
    expect(Number.isNaN(rows[1]!.revenueGrowth)).toBe(true);
    expect(rows[1]!.assetGrowth).toBeCloseTo(0.2);
  });
});

describe("gmpStats", () => {
  it("derives latest / min / max / avg / trend", () => {
    const stats = gmpStats([
      makeGmpRow({ date: "2026-07-10", value: 80 }),
      makeGmpRow({ date: "2026-07-12", value: 96 }),
      makeGmpRow({ date: "2026-07-11", value: 88 }),
    ]);
    expect(stats.latest).toBe(96); // sorted by date, not input order
    expect(stats.min).toBe(80);
    expect(stats.max).toBe(96);
    expect(stats.avg).toBeCloseTo(88);
    expect(stats.trend).toBe(16);
    expect(stats.direction).toBe("up");
  });
});

describe("gmpForecast", () => {
  it("fits a perfect line exactly (R^2 = 1, projection on the line)", () => {
    const rows = [
      makeGmpRow({ date: "2026-07-10", value: 10 }),
      makeGmpRow({ date: "2026-07-11", value: 20 }),
      makeGmpRow({ date: "2026-07-12", value: 30 }),
    ];
    const f = gmpForecast(rows, { cutoffPrice: 100, listingDate: "2026-07-14" });
    expect(f.ok).toBe(true);
    expect(f.slope).toBeCloseTo(10);
    expect(f.rSquared).toBeCloseTo(1);
    expect(f.horizonDays).toBe(4);
    expect(f.predictedGmp).toBeCloseTo(50);
    expect(f.predictedListingPrice).toBeCloseTo(150);
  });

  it("refuses to fit fewer than two readings", () => {
    expect(gmpForecast([makeGmpRow({ date: "2026-07-10", value: 10 })], { cutoffPrice: 100 }).ok).toBe(false);
  });
});

describe("daysBetween / niceScale", () => {
  it("computes whole-day differences from ISO dates", () => {
    expect(daysBetween("2026-07-17", "2026-07-21")).toBe(4);
    expect(daysBetween("2026-07-21", "2026-07-17")).toBe(-4);
    expect(Number.isNaN(daysBetween("", "2026-07-21"))).toBe(true);
  });

  it("produces bounds that contain the data with a nice step", () => {
    const scale = niceScale(3, 97, { maxTicks: 5 });
    expect(scale.lo).toBeLessThanOrEqual(3);
    expect(scale.hi).toBeGreaterThanOrEqual(97);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(2);
    expect(scale.ticks[0]).toBe(scale.lo);
    expect(scale.ticks[scale.ticks.length - 1]).toBe(scale.hi);
  });
});
