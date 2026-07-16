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
 */

import type { Application, ApplicationCategory, IpoDataset } from "./types";
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
  /** units * price. */
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
  /** Realistic quantity received IF the application wins. */
  likelyAllottedUnits: number;
  /** appliedUnits * gmp - the full-allotment ceiling. */
  bestCaseProfit: number;
  /** P * likelyAllottedUnits * gmp; NaN when probability is unknown. */
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

  const appliedUnits = app.contributors.reduce((sum, c) => sum + (Number.isFinite(c.units) ? c.units : 0), 0);
  const applicationTotal = app.contributors.reduce(
    (sum, c) => sum + (Number.isFinite(c.units) && Number.isFinite(c.price) ? c.units * c.price : 0),
    0,
  );
  if (applicationTotal <= 0) flags.push("Application has no corpus yet");

  const lots = lotSize > 0 ? appliedUnits / lotSize : NaN;
  if (lotSize > 0 && appliedUnits % lotSize !== 0) flags.push("Applied units are not a whole number of lots");

  const times = subs[app.category];
  const probabilityOfWinning = probabilityOfAllotment(app.category, times);
  if (probabilityOfWinning === null) flags.push("Subscription for this category is not set");

  const likelyAllottedUnits = likelyUnits(app.category, appliedUnits, lotSize, times);
  const bestCaseProfit = appliedUnits * latestGmp;
  const expectedProfit =
    probabilityOfWinning === null ? NaN : probabilityOfWinning * likelyAllottedUnits * latestGmp;

  // Allotment (actual) profit. In "total" mode the realised profit is entered
  // directly; in "detailed" mode it is derived from quantity and selling price.
  let rawActual = 0;
  if (app.allotted) {
    if (app.allotment.mode === "detailed") {
      let allottedQty = app.allotment.quantityAllotted;
      if (allottedQty > appliedUnits) {
        allottedQty = appliedUnits;
        flags.push("Allotted quantity exceeds applied - clamped");
      }
      if (allottedQty <= 0) flags.push("Marked allotted but quantity is zero");
      else if (lotSize > 0 && allottedQty % lotSize !== 0) flags.push("Allotted quantity is not a whole number of lots");
      rawActual = allottedQty * (app.allotment.sellingPrice - cutoffPrice);
    } else {
      rawActual = Number.isFinite(app.allotment.totalAmount) ? app.allotment.totalAmount : 0;
      if (rawActual === 0) flags.push("Marked allotted but total amount is zero");
    }
  }
  // Normalise negative zero (0 * negative) so the UI shows "₹0", not "-₹0".
  const actualProfit = rawActual === 0 ? 0 : rawActual;

  const contributors: ContributorMetrics[] = app.contributors.map((c) => {
    const contribution = Number.isFinite(c.units) && Number.isFinite(c.price) ? c.units * c.price : 0;
    const sharePct = applicationTotal > 0 ? contribution / applicationTotal : 0;
    return {
      id: c.id,
      name: c.name,
      units: c.units,
      price: c.price,
      contribution,
      sharePct,
      bestCaseProfit: sharePct * bestCaseProfit,
      expectedProfit: sharePct * expectedProfit,
      actualProfit: sharePct * actualProfit,
    };
  });

  const anyPriceMismatch = app.contributors.some(
    (c) => Number.isFinite(c.price) && cutoffPrice > 0 && Math.abs(c.price - cutoffPrice) > 0.005,
  );
  if (anyPriceMismatch) flags.push("A contributor price differs from the cut-off price");

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
