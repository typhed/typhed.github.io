import {
  bollinger,
  ema,
  macd,
  rsi,
  sma,
  type Candle,
  type LinePoint,
  type MacdPoint,
} from "@typhed/chart-engine"

export type IndicatorId = "sma" | "ema" | "bollinger" | "rsi" | "macd"

export interface IndicatorMeta {
  id: IndicatorId
  label: string
  detail: string
}

/** Indicators offered in the show/hide panel, with fixed v1 parameters. SMA,
 * EMA and Bollinger overlay the price pane; RSI and MACD get their own pane
 * (decided by `computeIndicators` / the chart, not by this metadata). */
export const INDICATORS: readonly IndicatorMeta[] = [
  { id: "sma", label: "SMA 20", detail: "Simple moving average" },
  { id: "ema", label: "EMA 21", detail: "Exponential moving average" },
  { id: "bollinger", label: "Bollinger 20, 2", detail: "Volatility bands" },
  { id: "rsi", label: "RSI 14", detail: "Relative strength" },
  { id: "macd", label: "MACD 12, 26, 9", detail: "Trend momentum" },
]

export type IndicatorState = Record<IndicatorId, boolean>

export const DEFAULT_INDICATOR_STATE: IndicatorState = {
  sma: false,
  ema: false,
  bollinger: false,
  rsi: false,
  macd: false,
}

export interface OverlayLine {
  id: string
  color: string
  dashed?: boolean
  data: LinePoint[]
}

export interface ChartIndicators {
  overlays: OverlayLine[]
  rsi: LinePoint[] | null
  macd: MacdPoint[] | null
}

/** Every indicator line's colour, overlays and the RSI and MACD panes alike. */
export const INDICATOR_COLORS = {
  sma: "#f59e0b",
  ema: "#3b82f6",
  bollinger: "#a855f7",
  bollingerBand: "rgba(168, 85, 247, 0.55)",
  rsi: "#22d3ee",
  macd: "#3b82f6",
  macdSignal: "#f59e0b",
} as const

/** Compute the render-ready indicator series for the current candles. */
export function computeIndicators(
  candles: readonly Candle[],
  state: IndicatorState,
): ChartIndicators {
  const overlays: OverlayLine[] = []

  if (state.sma) {
    overlays.push({ id: "sma", color: INDICATOR_COLORS.sma, data: sma(candles, 20) })
  }
  if (state.ema) {
    overlays.push({ id: "ema", color: INDICATOR_COLORS.ema, data: ema(candles, 21) })
  }
  if (state.bollinger) {
    const bands = bollinger(candles, 20, 2)
    overlays.push({
      id: "bb-middle",
      color: INDICATOR_COLORS.bollinger,
      data: bands.map((p) => ({ time: p.time, value: p.middle })),
    })
    overlays.push({
      id: "bb-upper",
      color: INDICATOR_COLORS.bollingerBand,
      dashed: true,
      data: bands.map((p) => ({ time: p.time, value: p.upper })),
    })
    overlays.push({
      id: "bb-lower",
      color: INDICATOR_COLORS.bollingerBand,
      dashed: true,
      data: bands.map((p) => ({ time: p.time, value: p.lower })),
    })
  }

  return {
    overlays,
    rsi: state.rsi ? rsi(candles, 14) : null,
    macd: state.macd ? macd(candles, 12, 26, 9) : null,
  }
}
