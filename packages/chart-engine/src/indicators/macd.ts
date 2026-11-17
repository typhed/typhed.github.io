import type { Candle } from "../types"
import { ema, emaSeries } from "./moving-average"
import type { MacdPoint } from "./types"

/**
 * MACD: (EMA(fast) - EMA(slow)) with a signal line = EMA(signalPeriod) of the
 * MACD line, and a histogram = MACD - signal. Every EMA uses the recursive
 * alpha = 2 / (n + 1) seeding, so the whole indicator matches pandas
 * `ewm(span=n, adjust=False).mean()` differences exactly.
 */
export function macd(
  candles: readonly Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdPoint[] {
  if (candles.length === 0) return []

  const fast = ema(candles, fastPeriod)
  const slow = ema(candles, slowPeriod)

  const macdLine = candles.map((candle, index) => ({
    time: candle.time,
    value: fast[index]!.value - slow[index]!.value,
  }))

  const signal = emaSeries(macdLine, signalPeriod)

  return macdLine.map((point, index) => ({
    time: point.time,
    macd: point.value,
    signal: signal[index]!.value,
    histogram: point.value - signal[index]!.value,
  }))
}
