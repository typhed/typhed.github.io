import { describe, expect, it } from "vitest"

import {
  deriveApplicationMetrics,
  probabilityOfAllotment,
  type DeriveApplicationParams,
} from "@/lib/ipo/applications"
import { makeApplication, makeContributor } from "@/lib/ipo/defaults"
import type { Application, ApplicationCategory } from "@/lib/ipo/types"

const GMP = 92
const CUTOFF = 574
const LOT = 26

function params(subs: DeriveApplicationParams["subscriptionByCategory"]): DeriveApplicationParams {
  return { latestGmp: GMP, cutoffPrice: CUTOFF, lotSize: LOT, subscriptionByCategory: subs }
}

function detailedApp(category: ApplicationCategory, units: number): Application {
  return makeApplication({
    name: "Test",
    category,
    contributionMode: "detailed",
    allotted: false,
    allotment: { mode: "total", quantityAllotted: 0, sellingPrice: 0, totalAmount: 0 },
    contributors: [makeContributor({ name: "A", units, price: CUTOFF, amount: 0 })],
  })
}

describe("probabilityOfAllotment", () => {
  it("is 1 when undersubscribed and 1/t when oversubscribed", () => {
    expect(probabilityOfAllotment("RETAIL", 0.8)).toBe(1)
    expect(probabilityOfAllotment("RETAIL", 4)).toBeCloseTo(0.25)
    expect(probabilityOfAllotment("bHNI", 20)).toBeCloseTo(0.05)
  })

  it("is null when the subscription is unknown", () => {
    expect(probabilityOfAllotment("RETAIL", undefined)).toBeNull()
    expect(probabilityOfAllotment("RETAIL", Number.NaN)).toBeNull()
  })
})

function totalModeApp(category: ApplicationCategory, amounts: number[]): Application {
  return makeApplication({
    name: "Total",
    category,
    contributionMode: "total",
    allotted: false,
    allotment: { mode: "total", quantityAllotted: 0, sellingPrice: 0, totalAmount: 0 },
    contributors: amounts.map((amount, i) =>
      makeContributor({ name: `C${i + 1}`, units: 0, price: 0, amount }),
    ),
  })
}

describe("profit tiers (full-allotment product rule)", () => {
  it("expected profit equals best-case until allotment, for every category", () => {
    const retail = deriveApplicationMetrics(detailedApp("RETAIL", LOT), params({ RETAIL: 4 }))
    expect(retail.probabilityOfWinning).toBeCloseTo(0.25) // badge keeps the odds
    expect(retail.bestCaseProfit).toBeCloseTo(LOT * GMP)
    expect(retail.expectedProfit).toBe(retail.bestCaseProfit)

    const hni = deriveApplicationMetrics(detailedApp("bHNI", 100 * LOT), params({ bHNI: 20 }))
    expect(hni.probabilityOfWinning).toBeCloseTo(1 / 20)
    expect(hni.expectedProfit).toBe(hni.bestCaseProfit)
  })

  it("total mode floors the corpus to whole lots (owner's ZERODHA example)", () => {
    // Corpus 12,23,768 at cut-off 574 x lot 26 (lot amount 14,924) = exactly 82
    // lots = 2,132 shares. No flooring flag on an exact multiple.
    const m = deriveApplicationMetrics(
      totalModeApp("bHNI", [423_768, 400_000, 400_000]),
      params({ bHNI: 26.01 }),
    )
    expect(m.applicationTotal).toBe(1_223_768)
    expect(m.appliedUnits).toBe(2132)
    expect(m.lots).toBe(82)
    expect(m.bestCaseProfit).toBeCloseTo(2132 * GMP)
    expect(m.expectedProfit).toBeCloseTo(2132 * GMP)
    expect(m.flags.some((f) => f.includes("FLOORED"))).toBe(false)
  })

  it("total mode flags and floors a corpus that is not a whole-lot multiple", () => {
    // 12,30,000 / 14,924 = 82.41 lots -> floors to 82 lots = 2,132 shares.
    const m = deriveApplicationMetrics(totalModeApp("bHNI", [1_230_000]), params({ bHNI: 20 }))
    expect(m.appliedUnits).toBe(2132)
    expect(m.flags).toContain("Corpus Not a Whole-Lot Multiple [FLOORED]")
    expect(m.bestCaseProfit).toBeCloseTo(2132 * GMP)
  })

  it("total mode keeps a whole lot at a fractional cut-off price", () => {
    // 1.1 x 13,000 is 14300.000000000002 in floating point, a hair above the
    // corpus, so a float division would floor exactly one lot to zero.
    const m = deriveApplicationMetrics(totalModeApp("RETAIL", [14_300]), {
      latestGmp: 0,
      cutoffPrice: 1.1,
      lotSize: 13_000,
      subscriptionByCategory: { RETAIL: 1 },
    })
    expect(m.appliedUnits).toBe(13_000)
    expect(m.lots).toBe(1)
    expect(m.flags.some((f) => f.includes("FLOORED"))).toBe(false)
  })

  it("unknown subscription: probability is null and flagged, tiers still computable", () => {
    const m = deriveApplicationMetrics(detailedApp("RETAIL", LOT), params({}))
    expect(m.probabilityOfWinning).toBeNull()
    expect(m.flags).toContain("Undefined Category Subscription")
    expect(m.expectedProfit).toBeCloseTo(LOT * GMP)
  })
})

describe("allotment accounting", () => {
  it("clamps over-allotted quantity to the applied quantity and flags it", () => {
    const app: Application = {
      ...detailedApp("RETAIL", LOT),
      allotted: true,
      allotment: { mode: "detailed", quantityAllotted: 2 * LOT, sellingPrice: 700, totalAmount: 0 },
    }
    const m = deriveApplicationMetrics(app, params({ RETAIL: 4 }))
    expect(m.actualProfit).toBeCloseTo(LOT * (700 - CUTOFF))
    expect(m.flags.some((f) => f.includes("CLAMPED"))).toBe(true)
  })

  it("normalises negative zero so the UI never renders -0", () => {
    const app: Application = {
      ...detailedApp("RETAIL", LOT),
      allotted: true,
      allotment: { mode: "detailed", quantityAllotted: 0, sellingPrice: 500, totalAmount: 0 },
    }
    const m = deriveApplicationMetrics(app, params({ RETAIL: 4 }))
    expect(Object.is(m.actualProfit, -0)).toBe(false)
  })

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
    })
    const m = deriveApplicationMetrics(app, params({ RETAIL: 2 }))
    expect(m.contributors[0]!.sharePct).toBeCloseTo(0.75)
    expect(m.contributors[1]!.sharePct).toBeCloseTo(0.25)
    expect(m.contributors[0]!.expectedProfit + m.contributors[1]!.expectedProfit).toBeCloseTo(
      m.expectedProfit,
    )
  })
})
