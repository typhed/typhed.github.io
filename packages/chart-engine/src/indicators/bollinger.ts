import type { Candle } from "../types"
import type { BandPoint } from "./types"

/**
 * Bollinger Bands: an SMA middle band with upper/lower bands at `k` population
 * standard deviations (ddof = 0). The population standard deviation matches
 * pandas `rolling(period).std(ddof=0)` and the classic Bollinger definition.
 */
export function bollinger(candles: readonly Candle[], period = 20, k = 2): BandPoint[] {
  if (period < 1 || candles.length < period) return []

  const out: BandPoint[] = []
  for (let i = period - 1; i < candles.length; i += 1) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j += 1) sum += candles[j]!.close
    const mean = sum / period

    let sq = 0
    for (let j = i - period + 1; j <= i; j += 1) {
      const diff = candles[j]!.close - mean
      sq += diff * diff
    }
    const std = Math.sqrt(sq / period)

    out.push({
      time: candles[i]!.time,
      middle: mean,
      upper: mean + k * std,
      lower: mean - k * std,
    })
  }
  return out
}
