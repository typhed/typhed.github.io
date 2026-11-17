import type { Candle } from "../types"

/**
 * Infer the base sampling interval (seconds) as the most common gap between
 * consecutive timestamps. Robust to occasional gaps because it uses the mode,
 * not the mean.
 */
export function inferBaseIntervalSeconds(candles: readonly Candle[]): number | null {
  if (candles.length < 2) return null

  const counts = new Map<number, number>()
  for (let i = 1; i < candles.length; i += 1) {
    const delta = candles[i]!.time - candles[i - 1]!.time
    if (delta > 0) counts.set(delta, (counts.get(delta) ?? 0) + 1)
  }

  let mode: number | null = null
  let best = 0
  for (const [delta, count] of counts) {
    if (count > best) {
      best = count
      mode = delta
    }
  }
  return mode
}

/**
 * Count how many base intervals are missing between the first and last bar,
 * given the inferred interval. Useful for a "N gaps detected" integrity note.
 */
export function countMissingIntervals(candles: readonly Candle[]): number {
  const interval = inferBaseIntervalSeconds(candles)
  if (interval === null || candles.length < 2) return 0

  let missing = 0
  for (let i = 1; i < candles.length; i += 1) {
    const gap = candles[i]!.time - candles[i - 1]!.time
    const steps = Math.round(gap / interval)
    if (steps > 1) missing += steps - 1
  }
  return missing
}
