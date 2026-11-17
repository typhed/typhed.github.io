import type { Candle } from "../types"
import { bucketStart, type Timeframe } from "./timeframe"

/**
 * Aggregate base candles into a higher timeframe.
 *
 * Rules per bucket: open = first, high = max, low = min, close = last,
 * volume = sum. Empty buckets (gaps in the source) produce no candle, which is
 * how chart platforms render missing periods - the gap stays visible rather
 * than being interpolated.
 *
 * Preconditions (enforced by validation upstream): `base` is sorted strictly
 * ascending by time with unique timestamps. Same-bucket rows are therefore
 * contiguous, so a single streaming pass is correct and O(n).
 *
 * Volume is summed with Kahan compensation to blunt float drift across long
 * runs of fractional volumes.
 */
export function aggregate(base: readonly Candle[], target: Timeframe): Candle[] {
  const out: Candle[] = []

  let current: Candle | null = null
  let currentBucket = Number.NaN
  let volumeComp = 0 // Kahan running compensation for the open bucket

  for (const bar of base) {
    const bucket = bucketStart(bar.time, target)

    if (current === null || bucket !== currentBucket) {
      if (current !== null) out.push(current)
      currentBucket = bucket
      volumeComp = 0
      current = {
        time: bucket,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }
      continue
    }

    if (bar.high > current.high) current.high = bar.high
    if (bar.low < current.low) current.low = bar.low
    current.close = bar.close

    if (current.volume !== null && bar.volume !== null) {
      const y = bar.volume - volumeComp
      const t = current.volume + y
      volumeComp = t - current.volume - y
      current.volume = t
    }
  }

  if (current !== null) out.push(current)
  return out
}
