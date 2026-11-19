/**
 * Pure derived analytics for the IPO Application Tracker.
 *
 * Every function is pure: the current GMP, cut-off price, lot size and the
 * per-category subscription map are injected (mirroring the `today`-injection
 * convention in `analytics.ts`), so the same inputs always produce the same
 * output and nothing time- or DOM-dependent leaks into the static export.
 *
 * Allotment probability follows SEBI ICDR guidelines. When a category is
 * oversubscribed `t` times, allotment of the minimum lot is by draw of lots
 * (retail always; sHNI/bHNI since the April-2022 amendment, Reg 32(3A)/49), so
 * `P = min(1, 1 / t)`. That is exact for the retail one-lot lottery and a
 * conservative lower bound for HNI (real per-applicant odds are higher, because
 * each NII application spans many lots) - the UI surfaces that caveat. When a
 * category is undersubscribed (`t <= 1`) the applicant expects the full applied
 * quantity, so `P = 1`. When the subscription is unknown, `P = null`.
 *
 * Quantities are whole lots only - partial-lot allotment does not exist in
 * India. In "total" mode the applied quantity is the corpus floored to whole
 * lots at the cut-off price: `floor(amount / cutoff / lotSize) x lotSize`.
 *
 * Profit tiers (product rule): "Best-Case Profit" assumes every applied lot is
 * allotted at the latest GMP, and "Expected Profit" shows the SAME full-
 * allotment figure until the allotment outcome is recorded - the win
 * probability badge carries the odds, the tiles carry rupee amounts. Once the
 * application is marked allotted, the actual quantity and selling price drive
 * the realised profit.
 */

import type { Application, ApplicationCategory, Contributor, IpoDataset } from "./types"
import { APPLICATION_CATEGORIES } from "./types"

/** Estimated probability of allotment for a category at `timesSubscribed`. */
export function probabilityOfAllotment(
  _category: ApplicationCategory,
  timesSubscribed: number | undefined | null,
): number | null {
  if (
    timesSubscribed === undefined ||
    timesSubscribed === null ||
    !Number.isFinite(timesSubscribed)
  ) {
    return null
  }
  if (timesSubscribed <= 1) return 1
  return Math.min(1, 1 / timesSubscribed)
}

export interface ContributorMetrics {
  id: string
  name: string
  units: number
  price: number
  /** This contributor's corpus in INR (units x price, or the entered amount in "total" mode). */
  contribution: number
  /** contribution / applicationTotal (0 when the application has no corpus). */
  sharePct: number
  bestCaseProfit: number
  expectedProfit: number
  actualProfit: number
}

export interface ApplicationMetrics {
  id: string
  category: ApplicationCategory
  appliedUnits: number
  applicationTotal: number
  /** appliedUnits / lotSize (whole in "total" mode; flagged if fractional in "detailed"). */
  lots: number
  probabilityOfWinning: number | null
  /** appliedUnits * gmp - the full-allotment ceiling. */
  bestCaseProfit: number
  /** Equals bestCaseProfit until allotment is recorded (see module doc). */
  expectedProfit: number
  /** quantityAllotted * (sellingPrice - cutoffPrice) when allotted, else 0. */
  actualProfit: number
  contributors: ContributorMetrics[]
  flags: string[]
}

export interface DeriveApplicationParams {
  /** Latest GMP per share (from `gmpStats(...).latest`). */
  latestGmp: number
  /** Issue / cut-off price paid for allotted shares (usually `priceBand.max`). */
  cutoffPrice: number
  lotSize: number
  /** Times-subscribed per application category, from the subscription panel. */
  subscriptionByCategory: Partial<Record<ApplicationCategory, number>>
}

/** Build a `category -> timesSubscribed` map from a dataset's subscription rows. */
export function subscriptionByCategory(
  data: IpoDataset,
): Partial<Record<ApplicationCategory, number>> {
  const map: Partial<Record<ApplicationCategory, number>> = {}
  for (const row of data.subscription) {
    if ((APPLICATION_CATEGORIES as readonly string[]).includes(row.category)) {
      map[row.category as ApplicationCategory] = row.timesSubscribed
    }
  }
  return map
}

/** Derive contribution splits, profit tiers and probability for one application. */
export function deriveApplicationMetrics(
  app: Application,
  params: DeriveApplicationParams,
): ApplicationMetrics {
  const { latestGmp, cutoffPrice, lotSize, subscriptionByCategory: subs } = params
  const flags: string[] = []

  // "detailed": corpus is units x price and shares are the entered units.
  // "total": the user enters the rupee corpus directly and the share count is
  // implied by the cut-off price (amount / cutoff). Everything downstream - the
  // corpus total, share splits and profit tiers - is computed the same way.
  const detailed = app.contributionMode !== "total"
  const contribOf = (c: Contributor): number =>
    detailed
      ? Number.isFinite(c.units) && Number.isFinite(c.price)
        ? c.units * c.price
        : 0
      : Number.isFinite(c.amount)
        ? c.amount
        : 0
  const unitsOf = (c: Contributor): number => {
    if (detailed) return Number.isFinite(c.units) ? c.units : 0
    const amount = Number.isFinite(c.amount) ? c.amount : 0
    return cutoffPrice > 0 ? amount / cutoffPrice : 0
  }

  const applicationTotal = app.contributors.reduce((sum, c) => sum + contribOf(c), 0)
  if (applicationTotal <= 0) flags.push("Undefined Corpus")

  // Applied quantity is whole lots only - partial-lot allotment does not exist
  // in India. "detailed" mode trusts the entered units (and flags a mismatch);
  // "total" mode floors the corpus to whole lots at the cut-off price.
  let appliedUnits: number
  if (detailed) {
    appliedUnits = app.contributors.reduce((sum, c) => sum + unitsOf(c), 0)
    if (lotSize > 0 && appliedUnits % lotSize !== 0) {
      flags.push("QTY Mismatch with Lot Size")
    }
  } else {
    // Whole paise on both sides: a fractional cut-off makes the lot amount a
    // float (1.1 x 13,000 = 14300.000000000002) that a float division would
    // floor one lot short of.
    const lotPaise = Math.round(cutoffPrice * lotSize * 100)
    appliedUnits =
      lotPaise > 0 ? Math.floor(Math.round(applicationTotal * 100) / lotPaise) * lotSize : 0
    const remainder = applicationTotal - appliedUnits * cutoffPrice
    if (appliedUnits > 0 && remainder > 0.005) {
      flags.push("Corpus Not a Whole-Lot Multiple [FLOORED]")
    }
  }

  const lots = lotSize > 0 ? appliedUnits / lotSize : NaN

  const times = subs[app.category]
  const probabilityOfWinning = probabilityOfAllotment(app.category, times)
  if (probabilityOfWinning === null) flags.push("Undefined Category Subscription")

  // Product rule: both tiers assume full allotment of the applied lots at the
  // latest GMP; the realised outcome takes over once allotment is recorded.
  const bestCaseProfit = appliedUnits * latestGmp
  const expectedProfit = bestCaseProfit

  // Allotment (actual) profit. In "total" mode the realised profit is entered
  // directly; in "detailed" mode it is derived from quantity and selling price.
  let rawActual = 0
  if (app.allotted) {
    if (app.allotment.mode === "detailed") {
      let allottedQty = app.allotment.quantityAllotted
      if (allottedQty > appliedUnits) {
        allottedQty = appliedUnits
        flags.push("Mismatch Allotted Quantity [CLAMPED]")
      }
      if (allottedQty <= 0) flags.push("Allotted Quantity is Zero")
      else if (lotSize > 0 && allottedQty % lotSize !== 0)
        flags.push("QTY Mismatch with Allotted Quantity Lot Size")
      rawActual = allottedQty * (app.allotment.sellingPrice - cutoffPrice)
    } else {
      rawActual = Number.isFinite(app.allotment.totalAmount) ? app.allotment.totalAmount : 0
      if (rawActual === 0) flags.push("Total Amount Undefined for Allotted")
    }
  }
  // Normalise negative zero (0 * negative) so the UI shows "₹0", not "-₹0".
  const actualProfit = rawActual === 0 ? 0 : rawActual

  const contributors: ContributorMetrics[] = app.contributors.map((c) => {
    const contribution = contribOf(c)
    const sharePct = applicationTotal > 0 ? contribution / applicationTotal : 0
    return {
      id: c.id,
      name: c.name,
      units: unitsOf(c),
      price: detailed ? (Number.isFinite(c.price) ? c.price : 0) : cutoffPrice,
      contribution,
      sharePct,
      bestCaseProfit: sharePct * bestCaseProfit,
      expectedProfit: sharePct * expectedProfit,
      actualProfit: sharePct * actualProfit,
    }
  })

  // A price mismatch is only knowable when a price is actually entered; "total"
  // mode applies at the cut-off by construction, so there is nothing to warn on.
  const anyPriceMismatch =
    detailed &&
    app.contributors.some(
      (c) => Number.isFinite(c.price) && cutoffPrice > 0 && Math.abs(c.price - cutoffPrice) > 0.005,
    )
  if (anyPriceMismatch) flags.push("Contributor Price Differs from Cut-Off Price")

  return {
    id: app.id,
    category: app.category,
    appliedUnits,
    applicationTotal,
    lots,
    probabilityOfWinning,
    bestCaseProfit,
    expectedProfit,
    actualProfit,
    contributors,
    flags,
  }
}

/** Derive metrics for every application in a dataset. */
export function deriveAllApplications(
  data: IpoDataset,
  params: DeriveApplicationParams,
): ApplicationMetrics[] {
  return data.applications.map((app) => deriveApplicationMetrics(app, params))
}
