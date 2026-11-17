import type { Candle } from "../types";
import type { LinePoint } from "./types";

/**
 * Wilder's Relative Strength Index over `period` bars. The first average gain
 * and loss are simple means of the first `period` changes (the SMA seed used
 * by TradingView), then smoothed with Wilder's running average
 * (alpha = 1 / period). A zero average loss yields RSI 100, except on a flat
 * series (zero gain AND zero loss) which yields the neutral 50.
 */
export function rsi(candles: readonly Candle[], period = 14): LinePoint[] {
  if (period < 1 || candles.length <= period) return [];

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = candles[i]!.close - candles[i - 1]!.close;
    if (change > 0) gainSum += change;
    else lossSum -= change;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const out: LinePoint[] = [];
  out.push({
    time: candles[period]!.time,
    value: rsiFromAverages(avgGain, avgLoss),
  });

  for (let i = period + 1; i < candles.length; i += 1) {
    const change = candles[i]!.close - candles[i - 1]!.close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push({ time: candles[i]!.time, value: rsiFromAverages(avgGain, avgLoss) });
  }
  return out;
}

function rsiFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
