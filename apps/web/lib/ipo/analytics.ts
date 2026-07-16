/**
 * Pure derived analytics and chart-scale helpers for the IPO dashboard.
 *
 * Every function here is pure and free of `Date.now()` - the current date is
 * injected as `today` so the same inputs always produce the same output. This
 * keeps the numbers testable and prevents a build-time date being baked into
 * the statically exported HTML (which would break hydration).
 */

import type { FinancialRow, GmpRow, IpoDataset, Milestone } from "./types";

const MS_PER_DAY = 86_400_000;

export type Direction = "up" | "down" | "flat";

export interface GmpStats {
  count: number;
  latest: number;
  first: number;
  min: number;
  max: number;
  avg: number;
  /** latest - first, in INR. */
  trend: number;
  direction: Direction;
}

export interface FinancialDerived extends FinancialRow {
  /** pat / grossRevenue, as a fraction (NaN if revenue is 0). */
  patMargin: number;
  /** Year-over-year change vs the previous period, as a fraction (NaN for the first row). */
  revenueGrowth: number;
  patGrowth: number;
  assetGrowth: number;
}

export interface IpoMetrics {
  minInvestment: number;
  minInvestmentLower: number;
  latestGmp: number;
  estListingPrice: number;
  /** latestGmp / priceBand.max, as a fraction. */
  listingGainPct: number;
  profitPerLot: number;
  gmp: GmpStats;
  /** Financials sorted oldest -> newest with growth/margin attached. */
  financials: FinancialDerived[];
  latestFinancial: FinancialDerived | null;
  listingDate: string | null;
  /** Whole days from `today` to the listing date; NaN when unknown. */
  daysToListing: number;
}

/** GMP rows sorted chronologically (ISO dates sort lexicographically). */
export function sortedGmp(rows: GmpRow[]): GmpRow[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date));
}

/** Milestones sorted chronologically. */
export function sortedTimeline(rows: Milestone[]): Milestone[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date));
}

/** Best-effort fiscal-year sort key from a period label (first run of digits). */
function fiscalKey(period: string): number {
  const match = period.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function gmpStats(rows: GmpRow[]): GmpStats {
  const values = sortedGmp(rows).map((row) => row.value);
  const count = values.length;
  if (count === 0) {
    return { count: 0, latest: NaN, first: NaN, min: NaN, max: NaN, avg: NaN, trend: NaN, direction: "flat" };
  }
  const first = values[0]!;
  const latest = values[count - 1]!;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / count;
  const trend = latest - first;
  const direction: Direction = trend > 0 ? "up" : trend < 0 ? "down" : "flat";
  return { count, latest, first, min, max, avg, trend, direction };
}

/** Attach YoY growth and PAT margin to each financial row, sorted oldest -> newest. */
export function financialsWithGrowth(rows: FinancialRow[]): FinancialDerived[] {
  const sorted = [...rows].sort((a, b) => fiscalKey(a.period) - fiscalKey(b.period));
  return sorted.map((row, idx) => {
    const prev = idx > 0 ? sorted[idx - 1]! : null;
    const growth = (curr: number, before: number | undefined) =>
      prev && Number.isFinite(before) && before !== 0 ? (curr - (before as number)) / (before as number) : NaN;
    return {
      ...row,
      patMargin: row.grossRevenue !== 0 ? row.pat / row.grossRevenue : NaN,
      revenueGrowth: growth(row.grossRevenue, prev?.grossRevenue),
      patGrowth: growth(row.pat, prev?.pat),
      assetGrowth: growth(row.totalAssets, prev?.totalAssets),
    };
  });
}

/** Whole days between two ISO dates; NaN if either is missing/invalid. */
export function daysBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return NaN;
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return NaN;
  return Math.round((to - from) / MS_PER_DAY);
}

/** Compose every headline metric the dashboard shows. `today` is ISO "yyyy-mm-dd" (or ""). */
export function deriveIpoMetrics(data: IpoDataset, today: string): IpoMetrics {
  const { lotSize, priceBand } = data.meta;
  const gmp = gmpStats(data.gmp);
  const latestGmp = gmp.latest;

  const financials = financialsWithGrowth(data.financials);
  const latestFinancial = financials.length > 0 ? financials[financials.length - 1]! : null;

  const listing = sortedTimeline(data.timeline).find((m) => /listing/i.test(m.label)) ?? null;
  const listingDate = listing ? listing.date : null;

  const minInvestment = lotSize * priceBand.max;
  const estListingPrice = priceBand.max + latestGmp;
  const listingGainPct = priceBand.max > 0 ? latestGmp / priceBand.max : NaN;

  return {
    minInvestment,
    minInvestmentLower: lotSize * priceBand.min,
    latestGmp,
    estListingPrice,
    listingGainPct,
    profitPerLot: latestGmp * lotSize,
    gmp,
    financials,
    latestFinancial,
    listingDate,
    daysToListing: listingDate && today ? daysBetween(today, listingDate) : NaN,
  };
}

/* --------------------------------------------------------------------- *
 * Chart-scale helpers (nice axis bounds and ticks).
 * --------------------------------------------------------------------- */

export interface Scale {
  lo: number;
  hi: number;
  step: number;
  ticks: number[];
}

/** Round a range to a "nice" value (1/2/5 x 10^n) - Heckbert's algorithm. */
function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range));
  const frac = range / 10 ** exp;
  let niceFrac: number;
  if (round) {
    niceFrac = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
  } else {
    niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  }
  return niceFrac * 10 ** exp;
}

/** Nice axis bounds + tick values for a data range. */
export function niceScale(
  min: number,
  max: number,
  options: { includeZero?: boolean; maxTicks?: number } = {},
): Scale {
  const { includeZero = false, maxTicks = 5 } = options;
  let lo = includeZero ? Math.min(0, min) : min;
  let hi = includeZero ? Math.max(0, max) : max;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const range = niceNum(hi - lo, false);
  const step = niceNum(range / Math.max(1, maxTicks - 1), true);
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return { lo: niceMin, hi: niceMax, step, ticks };
}
