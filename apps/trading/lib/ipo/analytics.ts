/**
 * Pure derived analytics and chart-scale helpers for the IPO dashboard.
 *
 * Every function here is pure and free of `Date.now()` - the current date is
 * injected as `today` so the same inputs always produce the same output. This
 * keeps the numbers testable and prevents a build-time date being baked into
 * the statically exported HTML (which would break hydration).
 */

import type { FinancialRow, GmpRow, IpoDataset, Milestone } from "./types"

const MS_PER_DAY = 86_400_000

export type Direction = "up" | "down" | "flat"

export interface GmpStats {
  count: number
  latest: number
  first: number
  /** Second-to-last reading; NaN when fewer than two readings exist. */
  prev: number
  min: number
  max: number
  avg: number
  /** latest - first, in INR (change since the first reading). */
  trend: number
  /** latest - prev, in INR (change since the previous reading); NaN when count < 2. */
  deltaPrev: number
  direction: Direction
}

/** A simple ordinary-least-squares projection of GMP onto the listing day. */
export interface GmpForecast {
  /** False when fewer than two readings make a fit impossible. */
  ok: boolean
  /** Least-squares slope, INR of GMP per day. */
  slope: number
  intercept: number
  /** Coefficient of determination in [0, 1]; 0 when GMP is pure noise. */
  rSquared: number
  /** Day offset (from the first reading) the projection is evaluated at. */
  horizonDays: number
  /** Projected GMP at the horizon. */
  predictedGmp: number
  /** cutoffPrice + predictedGmp, floored at 0. */
  predictedListingPrice: number
}

export interface FinancialDerived extends FinancialRow {
  /** pat / grossRevenue, as a fraction (NaN if revenue is 0). */
  patMargin: number
  /**
   * Year-over-year change vs the previous period, as a fraction. NaN for the
   * first row and whenever the base is not a positive number - percentage
   * growth from a zero or negative base (e.g. a loss year) is not meaningful
   * and would flip the sign of a genuine improvement.
   */
  revenueGrowth: number
  patGrowth: number
  assetGrowth: number
}

export interface IpoMetrics {
  minInvestment: number
  latestGmp: number
  estListingPrice: number
  /** latestGmp / priceBand.max, as a fraction. */
  listingGainPct: number
  profitPerLot: number
  gmp: GmpStats
  /** Linear-regression projection of GMP onto the listing day. */
  gmpForecast: GmpForecast
  /** Financials sorted oldest -> newest with growth/margin attached. */
  financials: FinancialDerived[]
  latestFinancial: FinancialDerived | null
  listingDate: string | null
  /** Whole days from `today` to the listing date; NaN when unknown. */
  daysToListing: number
}

/**
 * Loop-based min/max. `Math.min(...values)` spreads the array into call
 * arguments and throws a RangeError past the engine argument limit, so a large
 * imported dataset could crash the page; a loop has no such ceiling.
 */
export function valueRange(values: readonly number[]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return { min, max }
}

/** GMP rows sorted chronologically (ISO dates sort lexicographically). */
export function sortedGmp(rows: GmpRow[]): GmpRow[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

/** Milestones sorted chronologically. */
export function sortedTimeline(rows: Milestone[]): Milestone[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Whether a milestone label names the listing event. The single definition for
 * every listing check (headline metrics, timeline emphasis and icon).
 */
export function isListingMilestone(label: string): boolean {
  return /listing/i.test(label)
}

/** Best-effort fiscal-year sort key from a period label (first run of digits). */
function fiscalKey(period: string): number {
  const match = period.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function gmpStats(rows: GmpRow[]): GmpStats {
  const values = sortedGmp(rows).map((row) => row.value)
  const count = values.length
  if (count === 0) {
    return {
      count: 0,
      latest: NaN,
      first: NaN,
      prev: NaN,
      min: NaN,
      max: NaN,
      avg: NaN,
      trend: NaN,
      deltaPrev: NaN,
      direction: "flat",
    }
  }
  const first = values[0]!
  const latest = values[count - 1]!
  const prev = count > 1 ? values[count - 2]! : NaN
  const { min, max } = valueRange(values)
  const avg = values.reduce((sum, v) => sum + v, 0) / count
  const trend = latest - first
  const deltaPrev = count > 1 ? latest - prev : NaN
  const direction: Direction = trend > 0 ? "up" : trend < 0 ? "down" : "flat"
  return { count, latest, first, prev, min, max, avg, trend, deltaPrev, direction }
}

/**
 * Fit an ordinary-least-squares line to (day-offset, GMP) and project it onto
 * the listing day. `x` is each reading's whole-day offset from the first
 * reading, so extrapolating to the listing date is a natural horizon; when no
 * future listing date is known it projects one day past the last reading.
 */
export function gmpForecast(
  rows: GmpRow[],
  options: { cutoffPrice: number; listingDate?: string | null },
): GmpForecast {
  const none: GmpForecast = {
    ok: false,
    slope: NaN,
    intercept: NaN,
    rSquared: NaN,
    horizonDays: NaN,
    predictedGmp: NaN,
    predictedListingPrice: NaN,
  }

  const sorted = sortedGmp(rows)
  const n = sorted.length
  if (n < 2) return none

  const firstDate = sorted[0]!.date
  const xs = sorted.map((row) => daysBetween(firstDate, row.date))
  const ys = sorted.map((row) => row.value)
  if (xs.some((x) => !Number.isFinite(x)) || ys.some((y) => !Number.isFinite(y))) return none

  const meanX = xs.reduce((sum, x) => sum + x, 0) / n
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i]! - meanX
    const dy = ys[i]! - meanY
    sxx += dx * dx
    sxy += dx * dy
    syy += dy * dy
  }

  const lastX = xs[n - 1]!
  const listingOffset = options.listingDate ? daysBetween(firstDate, options.listingDate) : NaN
  const horizonDays =
    Number.isFinite(listingOffset) && listingOffset > lastX ? listingOffset : lastX + 1

  // All readings share one date: no slope is defined - project the flat mean.
  if (sxx <= 0) {
    const predictedListingPrice = Math.max(0, options.cutoffPrice + meanY)
    return {
      ok: true,
      slope: 0,
      intercept: meanY,
      rSquared: 0,
      horizonDays,
      predictedGmp: meanY,
      predictedListingPrice,
    }
  }

  const slope = sxy / sxx
  const intercept = meanY - slope * meanX
  const rSquared = syy > 0 ? Math.max(0, Math.min(1, (slope * sxy) / syy)) : 1
  const predictedGmp = slope * horizonDays + intercept
  const predictedListingPrice = Math.max(0, options.cutoffPrice + predictedGmp)
  return { ok: true, slope, intercept, rSquared, horizonDays, predictedGmp, predictedListingPrice }
}

/** Attach YoY growth and PAT margin to each financial row, sorted oldest -> newest. */
export function financialsWithGrowth(rows: FinancialRow[]): FinancialDerived[] {
  const sorted = [...rows].sort((a, b) => fiscalKey(a.period) - fiscalKey(b.period))
  return sorted.map((row, idx) => {
    const prev = idx > 0 ? sorted[idx - 1]! : null
    // Growth is only meaningful from a positive base: dividing by a negative
    // base (a loss year) inverts the sign of a real improvement.
    const growth = (curr: number, before: number | undefined) =>
      prev && Number.isFinite(before) && (before as number) > 0
        ? (curr - (before as number)) / (before as number)
        : NaN
    return {
      ...row,
      patMargin: row.grossRevenue !== 0 ? row.pat / row.grossRevenue : NaN,
      revenueGrowth: growth(row.grossRevenue, prev?.grossRevenue),
      patGrowth: growth(row.pat, prev?.pat),
      assetGrowth: growth(row.totalAssets, prev?.totalAssets),
    }
  })
}

/** Whole days between two ISO dates; NaN if either is missing/invalid. */
export function daysBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return NaN
  const from = Date.parse(`${fromIso}T00:00:00Z`)
  const to = Date.parse(`${toIso}T00:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return NaN
  return Math.round((to - from) / MS_PER_DAY)
}

/** Compose every headline metric the dashboard shows. `today` is ISO "yyyy-mm-dd" (or ""). */
export function deriveIpoMetrics(data: IpoDataset, today: string): IpoMetrics {
  const { lotSize, priceBand } = data.meta
  const gmp = gmpStats(data.gmp)
  const latestGmp = gmp.latest

  const financials = financialsWithGrowth(data.financials)
  const latestFinancial = financials.length > 0 ? financials[financials.length - 1]! : null

  const listing = sortedTimeline(data.timeline).find((m) => isListingMilestone(m.label)) ?? null
  const listingDate = listing ? listing.date : null

  const minInvestment = lotSize * priceBand.max
  const estListingPrice = priceBand.max + latestGmp
  const listingGainPct = priceBand.max > 0 ? latestGmp / priceBand.max : NaN

  return {
    minInvestment,
    latestGmp,
    estListingPrice,
    listingGainPct,
    profitPerLot: latestGmp * lotSize,
    gmp,
    gmpForecast: gmpForecast(data.gmp, { cutoffPrice: priceBand.max, listingDate }),
    financials,
    latestFinancial,
    listingDate,
    daysToListing: listingDate && today ? daysBetween(today, listingDate) : NaN,
  }
}

/* --------------------------------------------------------------------- *
 * Chart-scale helpers (nice axis bounds and ticks).
 * --------------------------------------------------------------------- */

export interface Scale {
  lo: number
  hi: number
  step: number
  ticks: number[]
}

/** Round a range to a "nice" value (1/2/5 x 10^n) - Heckbert's algorithm. */
function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range))
  const frac = range / 10 ** exp
  let niceFrac: number
  if (round) {
    niceFrac = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
  } else {
    niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  }
  return niceFrac * 10 ** exp
}

/** Nice axis bounds + tick values for a data range. */
export function niceScale(
  min: number,
  max: number,
  options: { includeZero?: boolean; maxTicks?: number } = {},
): Scale {
  const { includeZero = false, maxTicks = 5 } = options
  let lo = includeZero ? Math.min(0, min) : min
  let hi = includeZero ? Math.max(0, max) : max
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0
    hi = 1
  }
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const range = niceNum(hi - lo, false)
  const step = niceNum(range / Math.max(1, maxTicks - 1), true)
  const niceMin = Math.floor(lo / step) * step
  const niceMax = Math.ceil(hi / step) * step

  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)))
  }
  return { lo: niceMin, hi: niceMax, step, ticks }
}
