import type { Candle } from "@typhed/chart-engine"

/**
 * Wilder-smoothed Average True Range. `atr[i]` uses bars 0..i only (causal:
 * safe to read at the close of bar i); the first `period` bars are null
 * warm-up. True range needs a previous close, so index 0 is always null.
 */
export function wilderAtr(candles: readonly Candle[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null)
  if (candles.length < 2 || period < 1) return out

  let sum = 0
  let prev: number | null = null
  for (let i = 1; i < candles.length; i += 1) {
    const bar = candles[i]!
    const prevClose = candles[i - 1]!.close
    const tr = Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - prevClose),
      Math.abs(bar.low - prevClose),
    )
    if (i <= period) {
      sum += tr
      if (i === period) {
        prev = sum / period
        out[i] = prev
      }
    } else {
      prev = (prev! * (period - 1) + tr) / period
      out[i] = prev
    }
  }
  return out
}
