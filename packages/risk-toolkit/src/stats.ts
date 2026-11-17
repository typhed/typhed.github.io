/** Basic statistics used across the toolkit. */

/** Simple (arithmetic) period returns from a price series. */
export function simpleReturns(prices: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1]!
    out.push(prev === 0 ? 0 : (prices[i]! - prev) / prev)
  }
  return out
}

/** Continuously compounded (log) returns from a price series. */
export function logReturns(prices: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i += 1) {
    out.push(Math.log(prices[i]! / prices[i - 1]!))
  }
  return out
}

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN
  let sum = 0
  for (const x of xs) sum += x
  return sum / xs.length
}

/** Variance with `ddof` degrees of freedom (default 1 = sample variance). */
export function variance(xs: readonly number[], ddof = 1): number {
  const n = xs.length
  if (n - ddof <= 0) return Number.NaN
  const m = mean(xs)
  let sq = 0
  for (const x of xs) {
    const d = x - m
    sq += d * d
  }
  return sq / (n - ddof)
}

export function stdev(xs: readonly number[], ddof = 1): number {
  return Math.sqrt(variance(xs, ddof))
}

/** Annualised volatility = sample stdev of returns scaled by sqrt(periods). */
export function annualizedVolatility(returns: readonly number[], periodsPerYear: number): number {
  return stdev(returns, 1) * Math.sqrt(periodsPerYear)
}

/**
 * Linear-interpolation quantile of a sample, matching numpy's default
 * (`method="linear"`). `q` is in [0, 1].
 */
export function quantile(xs: readonly number[], q: number): number {
  const n = xs.length
  if (n === 0) return Number.NaN
  const sorted = [...xs].sort((a, b) => a - b)
  if (n === 1) return sorted[0]!

  const pos = (n - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  const frac = pos - lo
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * frac
}

export interface DrawdownResult {
  /** Maximum peak-to-trough drop as a positive fraction (0.2 = 20%). */
  maxDrawdown: number
  peakIndex: number
  troughIndex: number
}

/** Maximum drawdown of an equity curve. */
export function maxDrawdown(equity: readonly number[]): DrawdownResult {
  let peak = equity[0] ?? 0
  let peakIndex = 0
  let worst = 0
  let worstPeakIndex = 0
  let worstTroughIndex = 0

  for (let i = 0; i < equity.length; i += 1) {
    const value = equity[i]!
    if (value > peak) {
      peak = value
      peakIndex = i
    }
    const dd = peak > 0 ? (peak - value) / peak : 0
    if (dd > worst) {
      worst = dd
      worstPeakIndex = peakIndex
      worstTroughIndex = i
    }
  }

  return {
    maxDrawdown: worst,
    peakIndex: worstPeakIndex,
    troughIndex: worstTroughIndex,
  }
}

/** Build an equity curve from an array of period returns and a starting value. */
export function equityCurve(returns: readonly number[], start = 1): number[] {
  const curve: number[] = [start]
  let value = start
  for (const r of returns) {
    value *= 1 + r
    curve.push(value)
  }
  return curve
}
