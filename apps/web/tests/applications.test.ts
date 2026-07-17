import { describe, expect, it } from "vitest";

import {
  deriveApplicationMetrics,
  probabilityOfAllotment,
  type DeriveApplicationParams,
} from "@/lib/ipo/applications";
import { makeApplication, makeContributor } from "@/lib/ipo/defaults";
import type { Application, ApplicationCategory } from "@/lib/ipo/types";

const GMP = 92;
const CUTOFF = 574;
const LOT = 26;

function params(subs: DeriveApplicationParams["subscriptionByCategory"]): DeriveApplicationParams {
  return { latestGmp: GMP, cutoffPrice: CUTOFF, lotSize: LOT, subscriptionByCategory: subs };
}

function detailedApp(category: ApplicationCategory, units: number): Application {
  return makeApplication({
    name: "Test",
    category,
    contributionMode: "detailed",
    allotted: false,
    allotment: { mode: "total", quantityAllotted: 0, sellingPrice: 0, totalAmount: 0 },
    contributors: [makeContributor({ name: "A", units, price: CUTOFF, amount: 0 })],
  });
}

describe("probabilityOfAllotment", () => {
  it("is 1 when undersubscribed and 1/t when oversubscribed", () => {
    expect(probabilityOfAllotment("RETAIL", 0.8)).toBe(1);
    expect(probabilityOfAllotment("RETAIL", 4)).toBeCloseTo(0.25);
    expect(probabilityOfAllotment("bHNI", 20)).toBeCloseTo(0.05);
  });

  it("is null when the subscription is unknown", () => {
    expect(probabilityOfAllotment("RETAIL", undefined)).toBeNull();
    expect(probabilityOfAllotment("RETAIL", Number.NaN)).toBeNull();
  });
});

describe("expected profit", () => {
  it("retail: one-lot lottery, expectation = lotSize x GMP / t", () => {
    const m = deriveApplicationMetrics(detailedApp("RETAIL", LOT), params({ RETAIL: 4 }));
    expect(m.probabilityOfWinning).toBeCloseTo(0.25);
    expect(m.likelyAllottedUnits).toBe(LOT);
    expect(m.expectedProfit).toBeCloseTo((LOT * GMP) / 4);
  });

  it("HNI: proportionate expectation applied/t x GMP - NOT discounted by P again", () => {
    const applied = 100 * LOT;
    const t = 20;
    const m = deriveApplicationMetrics(detailedApp("bHNI", applied), params({ bHNI: t }));
    // The win-probability column stays the conservative lower bound...
    expect(m.probabilityOfWinning).toBeCloseTo(1 / t);
    // ...but the expectation obeys share conservation: applied/t units.
    expect(m.likelyAllottedUnits).toBeCloseTo(applied / t);
    expect(m.expectedProfit).toBeCloseTo((applied / t) * GMP);
  });

  it("undersubscribed: full quantity expected", () => {
    const m = deriveApplicationMetrics(detailedApp("sHNI", 5 * LOT), params({ sHNI: 0.6 }));
    expect(m.probabilityOfWinning).toBe(1);
    expect(m.expectedProfit).toBeCloseTo(5 * LOT * GMP);
  });

  it("unknown subscription: NaN expectation and a flag", () => {
    const m = deriveApplicationMetrics(detailedApp("RETAIL", LOT), params({}));
    expect(m.probabilityOfWinning).toBeNull();
    expect(Number.isNaN(m.expectedProfit)).toBe(true);
    expect(m.flags).toContain("Undefined Category Subscription");
  });
});

describe("allotment accounting", () => {
  it("clamps over-allotted quantity to the applied quantity and flags it", () => {
    const app: Application = {
      ...detailedApp("RETAIL", LOT),
      allotted: true,
      allotment: { mode: "detailed", quantityAllotted: 2 * LOT, sellingPrice: 700, totalAmount: 0 },
    };
    const m = deriveApplicationMetrics(app, params({ RETAIL: 4 }));
    expect(m.actualProfit).toBeCloseTo(LOT * (700 - CUTOFF));
    expect(m.flags.some((f) => f.includes("CLAMPED"))).toBe(true);
  });

  it("normalises negative zero so the UI never renders -0", () => {
    const app: Application = {
      ...detailedApp("RETAIL", LOT),
      allotted: true,
      allotment: { mode: "detailed", quantityAllotted: 0, sellingPrice: 500, totalAmount: 0 },
    };
    const m = deriveApplicationMetrics(app, params({ RETAIL: 4 }));
    expect(Object.is(m.actualProfit, -0)).toBe(false);
  });

  it("splits contributor shares by corpus fraction", () => {
    const app = makeApplication({
      name: "Split",
      category: "RETAIL",
      contributionMode: "total",
      allotted: false,
      allotment: { mode: "total", quantityAllotted: 0, sellingPrice: 0, totalAmount: 0 },
      contributors: [
        makeContributor({ name: "A", units: 0, price: 0, amount: 75_000 }),
        makeContributor({ name: "B", units: 0, price: 0, amount: 25_000 }),
      ],
    });
    const m = deriveApplicationMetrics(app, params({ RETAIL: 2 }));
    expect(m.contributors[0]!.sharePct).toBeCloseTo(0.75);
    expect(m.contributors[1]!.sharePct).toBeCloseTo(0.25);
    expect(m.contributors[0]!.expectedProfit + m.contributors[1]!.expectedProfit).toBeCloseTo(
      m.expectedProfit,
    );
  });
});
