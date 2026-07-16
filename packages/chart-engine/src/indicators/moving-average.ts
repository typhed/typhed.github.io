import type { Candle } from "../types";
import type { LinePoint } from "./types";

/**
 * Simple moving average of close over `period` bars. Emitted from the first
 * full window onward, matching pandas `close.rolling(period).mean()`.
 */
export function sma(candles: readonly Candle[], period: number): LinePoint[] {
  if (period < 1 || candles.length < period) return [];

  const out: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i]!.close;
    if (i >= period) sum -= candles[i - period]!.close;
    if (i >= period - 1) {
      out.push({ time: candles[i]!.time, value: sum / period });
    }
  }
  return out;
}

/**
 * Exponential moving average of close with alpha = 2 / (period + 1), seeded
 * with the first close and applied recursively - identical to pandas
 * `close.ewm(span=period, adjust=False).mean()` at every index. Emitted for
 * every bar (early values are warm-up).
 */
export function ema(candles: readonly Candle[], period: number): LinePoint[] {
  if (period < 1 || candles.length === 0) return [];

  const alpha = 2 / (period + 1);
  const out: LinePoint[] = [];
  let prev = candles[0]!.close;
  out.push({ time: candles[0]!.time, value: prev });

  for (let i = 1; i < candles.length; i += 1) {
    prev = alpha * candles[i]!.close + (1 - alpha) * prev;
    out.push({ time: candles[i]!.time, value: prev });
  }
  return out;
}

/** EMA over a bare number series (used by MACD on the MACD line). */
export function emaSeries(
  values: readonly { time: number; value: number }[],
  period: number,
): LinePoint[] {
  if (period < 1 || values.length === 0) return [];

  const alpha = 2 / (period + 1);
  const out: LinePoint[] = [];
  let prev = values[0]!.value;
  out.push({ time: values[0]!.time as LinePoint["time"], value: prev });

  for (let i = 1; i < values.length; i += 1) {
    prev = alpha * values[i]!.value + (1 - alpha) * prev;
    out.push({ time: values[i]!.time as LinePoint["time"], value: prev });
  }
  return out;
}
