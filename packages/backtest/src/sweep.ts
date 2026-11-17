import { ema, type Candle } from "@typhed/chart-engine"

import { runBacktest } from "./backtest"
import type { BacktestParams, BacktestStats, StrategyTemplate } from "./types"

/**
 * The EMA sweep: run the backtest over a grid of EMA periods (and holding
 * caps), score every cell, and apply the three mandatory overfitting guards
 * from the research doc - a 19-50 value sweep is a curve-fitting machine
 * unless guarded:
 *
 *   1. Minimum sample: cells with fewer than `minTrades` closed trades are
 *      flagged and excluded from the best-EMA badge.
 *   2. Neighbor stability: the badge goes to the best plateau - the score
 *      smoothed over N +/- 2 - never to a single-spike winner.
 *   3. Walk-forward: fit on the first 70%, confirm on the last 30%; a cell
 *      whose out-of-sample score collapses below half its in-sample score
 *      is flagged for a visible degradation warning.
 *
 * The headline score is avgR * sqrt(trades): expectancy in R units scaled
 * by statistical weight, so ten lucky trades cannot outrank a hundred
 * ordinary ones.
 */

export interface SweepParams {
  template: StrategyTemplate
  /** EMA periods to sweep (default 5..50). */
  emaPeriods?: readonly number[]
  /** Holding caps to sweep (default: just `holdingCapBars`). */
  holdingCaps?: readonly number[]
  holdingCapBars: number
  roundTripCostBps: number
  atrStopMultiple?: number
  atrPeriod?: number
  startEquity?: number
  riskPercent?: number
  /** dualCross: slow period = round(fast * slowRatio), min fast + 1. */
  slowRatio?: number
  /** Guard 1 threshold (default 30). */
  minTrades?: number
  /** Guard 3 split (default 0.7 = fit on the first 70%). */
  walkForwardSplit?: number
}

export interface SweepCell {
  emaPeriod: number
  holdingCapBars: number
  slowEmaPeriod: number | null
  stats: BacktestStats
  /** "Follows this EMA" measure, independent of P&L (null: too few touches). */
  touchFidelity: number | null
  inSampleScore: number
  outOfSampleScore: number
  score: number
  /** Guard 1: fewer than minTrades closed trades. */
  lowSample: boolean
  /** Guard 3: out-of-sample score collapsed below half of in-sample. */
  oosDegraded: boolean
}

export interface SweepRow {
  emaPeriod: number
  /** The best cell (by score) among this N's holding caps. */
  cell: SweepCell
  /** Guard 2: score smoothed over N +/- 2 across rows. */
  smoothedScore: number
}

export interface SweepResult {
  rows: SweepRow[]
  /** The plateau winner, or null when every row is low-sample. */
  best: SweepRow | null
  minTrades: number
  walkForwardSplit: number
}

const DEFAULT_EMA_PERIODS = Array.from({ length: 46 }, (_, i) => i + 5)

function scoreOf(stats: BacktestStats): number {
  return stats.trades > 0 ? stats.avgR * Math.sqrt(stats.trades) : 0
}

/**
 * Touch fidelity for one EMA: of the bars that touched the EMA from above
 * while the trend held (previous close above the EMA), how many resolved
 * upward - a close above the touch bar's high within the holding window,
 * before any close back below the EMA. Independent of costs and sizing.
 * Returns null below 10 touches - too few to mean anything.
 */
export function touchFidelity(
  candles: readonly Candle[],
  emaValues: readonly number[],
  holdingCapBars: number,
): number | null {
  const window = Math.max(1, holdingCapBars)
  let touches = 0
  let resolved = 0

  for (let t = 1; t < candles.length; t += 1) {
    const bar = candles[t]!
    const emaT = emaValues[t]!
    const prevAbove = candles[t - 1]!.close > emaValues[t - 1]!
    if (!(prevAbove && bar.low <= emaT)) continue

    touches += 1
    for (let k = 1; k <= window && t + k < candles.length; k += 1) {
      const future = candles[t + k]!
      if (future.close < emaValues[t + k]!) break
      if (future.close > bar.high) {
        resolved += 1
        break
      }
    }
  }

  return touches >= 10 ? resolved / touches : null
}

/** One sweep step: the full grid for one EMA period. */
export function sweepCellsForPeriod(
  candles: readonly Candle[],
  params: SweepParams,
  emaPeriod: number,
): SweepCell[] {
  const caps =
    params.holdingCaps && params.holdingCaps.length > 0
      ? params.holdingCaps
      : [params.holdingCapBars]
  const minTrades = params.minTrades ?? 30
  const split = params.walkForwardSplit ?? 0.7
  const splitIndex = Math.floor(candles.length * split)

  const slowEmaPeriod =
    params.template === "dualCross"
      ? Math.max(emaPeriod + 1, Math.round(emaPeriod * (params.slowRatio ?? 2.5)))
      : null

  const emaValues = ema(candles, emaPeriod).map((p) => p.value)

  return caps.map((cap) => {
    const backtestParams: BacktestParams = {
      template: params.template,
      emaPeriod,
      ...(slowEmaPeriod !== null ? { slowEmaPeriod } : {}),
      holdingCapBars: cap,
      roundTripCostBps: params.roundTripCostBps,
      ...(params.atrStopMultiple !== undefined ? { atrStopMultiple: params.atrStopMultiple } : {}),
      ...(params.atrPeriod !== undefined ? { atrPeriod: params.atrPeriod } : {}),
      ...(params.startEquity !== undefined ? { startEquity: params.startEquity } : {}),
      ...(params.riskPercent !== undefined ? { riskPercent: params.riskPercent } : {}),
    }

    const full = runBacktest(candles, backtestParams)
    const inSample = runBacktest(candles.slice(0, splitIndex), backtestParams)
    const outOfSample = runBacktest(candles.slice(splitIndex), backtestParams)

    const inScore = scoreOf(inSample.stats)
    const outScore = scoreOf(outOfSample.stats)

    return {
      emaPeriod,
      holdingCapBars: cap,
      slowEmaPeriod,
      stats: full.stats,
      touchFidelity: touchFidelity(candles, emaValues, cap),
      inSampleScore: inScore,
      outOfSampleScore: outScore,
      score: scoreOf(full.stats),
      lowSample: full.stats.trades < minTrades,
      oosDegraded: inScore > 0 && outScore < 0.5 * inScore,
    }
  })
}

export function runSweep(
  candles: readonly Candle[],
  params: SweepParams,
  onProgress?: (done: number, total: number) => void,
): SweepResult {
  const periods =
    params.emaPeriods && params.emaPeriods.length > 0 ? params.emaPeriods : DEFAULT_EMA_PERIODS
  const minTrades = params.minTrades ?? 30

  const rows: SweepRow[] = []
  periods.forEach((emaPeriod, index) => {
    const cells = sweepCellsForPeriod(candles, params, emaPeriod)
    const best = cells.reduce((a, b) => (b.score > a.score ? b : a))
    rows.push({ emaPeriod, cell: best, smoothedScore: 0 })
    onProgress?.(index + 1, periods.length)
  })

  // Guard 2: smooth over N +/- 2 by row position (the grid is ordered).
  for (let i = 0; i < rows.length; i += 1) {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - 2); j <= Math.min(rows.length - 1, i + 2); j += 1) {
      sum += rows[j]!.cell.score
      count += 1
    }
    rows[i]!.smoothedScore = sum / count
  }

  let best: SweepRow | null = null
  for (const row of rows) {
    if (row.cell.lowSample) continue
    if (best === null || row.smoothedScore > best.smoothedScore) best = row
  }

  return {
    rows,
    best,
    minTrades,
    walkForwardSplit: params.walkForwardSplit ?? 0.7,
  }
}
