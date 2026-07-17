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
 * Expected profit uses the category's allotment model, not `P` alone. Retail is
 * a one-lot lottery: expectation = `P x lotSize x GMP` = `lotSize x GMP / t`.
 * Non-retail categories (sHNI / bHNI / shareholder) allot proportionately under
 * share conservation - every applicant's expected quantity is `applied / t` -
 * so the expectation is `(applied / t) x GMP` directly. Multiplying that
 * proportionate quantity by the lottery lower bound `1 / t` again (the previous
 * formula) double-discounted HNI expectations by roughly the factor `t`.
 */

import type { Application, ApplicationCategory, Contributor, IpoDataset } from "./types";
import { APPLICATION_CATEGORIES } from "./types";

/** Estimated probability of allotment for a category at `timesSubscribed`. */
export function probabilityOfAllotment(
  _category: ApplicationCategory,
  timesSubscribed: number | undefined | null,
): number | null {
  if (timesSubscribed === undefined || timesSubscribed === null || !Number.isFinite(timesSubscribed)) {
    return null;
  }
  if (timesSubscribed <= 1) return 1;
  return Math.min(1, 1 / timesSubscribed);
}

export interface ContributorMetrics {
  id: string;
  name: string;
  units: number;
  price: number;
  /** This contributor's corpus in INR (units x price, or the entered amount in "total" mode). */
  contribution: number;
  /** contribution / applicationTotal (0 when the application has no corpus). */
  sharePct: number;
  bestCaseProfit: number;
  expectedProfit: number;
  actualProfit: number;
}

export interface ApplicationMetrics {
  id: string;
  category: ApplicationCategory;
  appliedUnits: number;
  applicationTotal: number;
  /** appliedUnits / lotSize (may be fractional - flagged). */
  lots: number;
  probabilityOfWinning: number | null;
  /**
   * Expected allotment quantity under the category's model: retail wins one
   * lot with probability `1 / t`; other categories expect the proportionate
   * `applied / t`.
   */
  likelyAllottedUnits: number;
  /** appliedUnits * gmp - the full-allotment ceiling. */
  bestCaseProfit: number;
  /** Expected units x gmp (see module doc); NaN when the subscription is unknown. */
  expectedProfit: number;
  /** quantityAllotted * (sellingPrice - cutoffPrice) when allotted, else 0. */
  actualProfit: number;
  contributors: ContributorMetrics[];
  flags: string[];
}

export interface DeriveApplicationParams {
  /** Latest GMP per share (from `gmpStats(...).latest`). */
  latestGmp: number;
  /** Issue / cut-off price paid for allotted shares (usually `priceBand.max`). */
  cutoffPrice: number;
  lotSize: number;
  /** Times-subscribed per application category, from the subscription panel. */
  subscriptionByCategory: Partial<Record<ApplicationCategory, number>>;
}

/** Build a `category -> timesSubscribed` map from a dataset's subscription rows. */
export function subscriptionByCategory(
  data: IpoDataset,
): Partial<Record<ApplicationCategory, number>> {
  const map: Partial<Record<ApplicationCategory, number>> = {};
  for (const row of data.subscription) {
    if ((APPLICATION_CATEGORIES as readonly string[]).includes(row.category)) {
      map[row.category as ApplicationCategory] = row.timesSubscribed;
    }
  }
  return map;
}

/**
 * Quantity used by the expected-profit calculation. Retail: the single lot the
 * draw can award (capped at what was applied). Non-retail: the proportionate
 * expectation `applied / t`, which already embodies the odds of the draw, so it
 * must NOT be multiplied by the win probability again.
 */
function likelyUnits(
  category: ApplicationCategory,
  appliedUnits: number,
  lotSize: number,
  times: number | undefined,
): number {
  if (times === undefined || times <= 1) return appliedUnits;
  if (category === "RETAIL") return Math.min(appliedUnits, lotSize);
  return appliedUnits / times;
}

/** Derive contribution splits, profit tiers and probability for one application. */
export function deriveApplicationMetrics(
  app: Application,
  params: DeriveApplicationParams,
): ApplicationMetrics {
  const { latestGmp, cutoffPrice, lotSize, subscriptionByCategory: subs } = params;
  const flags: string[] = [];

  // "detailed": corpus is units x price and shares are the entered units.
  // "total": the user enters the rupee corpus directly and the share count is
  // implied by the cut-off price (amount / cutoff). Everything downstream - the
  // corpus total, share splits and profit tiers - is computed the same way.
  const detailed = app.contributionMode !== "total";
  const contribOf = (c: Contributor): number =>
    detailed
      ? Number.isFinite(c.units) && Number.isFinite(c.price)
        ? c.units * c.price
        : 0
      : Number.isFinite(c.amount)
        ? c.amount
        : 0;
  const unitsOf = (c: Contributor): number => {
    if (detailed) return Number.isFinite(c.units) ? c.units : 0;
    const amount = Number.isFinite(c.amount) ? c.amount : 0;
    return cutoffPrice > 0 ? amount / cutoffPrice : 0;
  };

  const appliedUnits = app.contributors.reduce((sum, c) => sum + unitsOf(c), 0);
  const applicationTotal = app.contributors.reduce((sum, c) => sum + contribOf(c), 0);
  if (applicationTotal <= 0) flags.push("Undefined Corpus");

  const lots = lotSize > 0 ? appliedUnits / lotSize : NaN;
  // Only meaningful when units are entered directly; "total" mode derives a
  // fractional share count that is never a whole number of lots.
  if (detailed && lotSize > 0 && appliedUnits % lotSize !== 0) {
    flags.push("QTY Mismatch with Lot Size");
  }

  const times = subs[app.category];
  const probabilityOfWinning = probabilityOfAllotment(app.category, times);
  if (probabilityOfWinning === null) flags.push("Undefined Category Subscription");

  const likelyAllottedUnits = likelyUnits(app.category, appliedUnits, lotSize, times);
  const bestCaseProfit = appliedUnits * latestGmp;
  // Retail is a lottery (P x one lot); non-retail expectation `applied / t` is
  // already probability-weighted by share conservation, so P is not re-applied.
  const expectedUnits =
    app.category === "RETAIL"
      ? (probabilityOfWinning ?? NaN) * likelyAllottedUnits
      : likelyAllottedUnits;
  const expectedProfit = probabilityOfWinning === null ? NaN : expectedUnits * latestGmp;

  // Allotment (actual) profit. In "total" mode the realised profit is entered
  // directly; in "detailed" mode it is derived from quantity and selling price.
  let rawActual = 0;
  if (app.allotted) {
    if (app.allotment.mode === "detailed") {
      let allottedQty = app.allotment.quantityAllotted;
      if (allottedQty > appliedUnits) {
        allottedQty = appliedUnits;
        flags.push("Mismatch Alloted Quantity [CLAMPED]");
      }
      if (allottedQty <= 0) flags.push("Alloted Quantity is Zero");
      else if (lotSize > 0 && allottedQty % lotSize !== 0) flags.push("QTY Mismatch with Alloted Quantity Lot Size");
      rawActual = allottedQty * (app.allotment.sellingPrice - cutoffPrice);
    } else {
      rawActual = Number.isFinite(app.allotment.totalAmount) ? app.allotment.totalAmount : 0;
      if (rawActual === 0) flags.push("Total Amount Undefined for Alloted");
    }
  }
  // Normalise negative zero (0 * negative) so the UI shows "₹0", not "-₹0".
  const actualProfit = rawActual === 0 ? 0 : rawActual;

  const contributors: ContributorMetrics[] = app.contributors.map((c) => {
    const contribution = contribOf(c);
    const sharePct = applicationTotal > 0 ? contribution / applicationTotal : 0;
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
    };
  });

  // A price mismatch is only knowable when a price is actually entered; "total"
  // mode applies at the cut-off by construction, so there is nothing to warn on.
  const anyPriceMismatch =
    detailed &&
    app.contributors.some(
      (c) => Number.isFinite(c.price) && cutoffPrice > 0 && Math.abs(c.price - cutoffPrice) > 0.005,
    );
  if (anyPriceMismatch) flags.push("Invalid Contributor Price from Cutt-Off Value");

  return {
    id: app.id,
    category: app.category,
    appliedUnits,
    applicationTotal,
    lots,
    probabilityOfWinning,
    likelyAllottedUnits,
    bestCaseProfit,
    expectedProfit,
    actualProfit,
    contributors,
    flags,
  };
}

/** Derive metrics for every application in a dataset. */
export function deriveAllApplications(
  data: IpoDataset,
  params: DeriveApplicationParams,
): ApplicationMetrics[] {
  return data.applications.map((app) => deriveApplicationMetrics(app, params));
}
