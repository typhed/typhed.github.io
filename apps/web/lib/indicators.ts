import {
  bollinger,
  ema,
  macd,
  rsi,
  sma,
  type Candle,
  type LinePoint,
  type MacdPoint,
} from "@typhed/chart-engine";

export type IndicatorId = "sma" | "ema" | "bollinger" | "rsi" | "macd";

export interface IndicatorMeta {
  id: IndicatorId;
  label: string;
  detail: string;
  placement: "overlay" | "pane";
}

/** Indicators offered in the show/hide panel, with fixed v1 parameters. */
export const INDICATORS: readonly IndicatorMeta[] = [
  { id: "sma", label: "SMA 20", detail: "Simple moving average", placement: "overlay" },
  { id: "ema", label: "EMA 21", detail: "Exponential moving average", placement: "overlay" },
  { id: "bollinger", label: "Bollinger 20, 2", detail: "Volatility bands", placement: "overlay" },
  { id: "rsi", label: "RSI 14", detail: "Relative strength", placement: "pane" },
  { id: "macd", label: "MACD 12, 26, 9", detail: "Trend momentum", placement: "pane" },
];

export type IndicatorState = Record<IndicatorId, boolean>;

export const DEFAULT_INDICATOR_STATE: IndicatorState = {
  sma: false,
  ema: false,
  bollinger: false,
  rsi: false,
  macd: false,
};

export interface OverlayLine {
  id: string;
  color: string;
  dashed?: boolean;
  data: LinePoint[];
}

export interface ChartIndicators {
  overlays: OverlayLine[];
  rsi: LinePoint[] | null;
  macd: MacdPoint[] | null;
}

const COLORS = {
  sma: "#f59e0b",
  ema: "#3b82f6",
  bollinger: "#a855f7",
  bollingerBand: "rgba(168, 85, 247, 0.55)",
} as const;

/** Compute the render-ready indicator series for the current candles. */
export function computeIndicators(
  candles: readonly Candle[],
  state: IndicatorState,
): ChartIndicators {
  const overlays: OverlayLine[] = [];

  if (state.sma) {
    overlays.push({ id: "sma", color: COLORS.sma, data: sma(candles, 20) });
  }
  if (state.ema) {
    overlays.push({ id: "ema", color: COLORS.ema, data: ema(candles, 21) });
  }
  if (state.bollinger) {
    const bands = bollinger(candles, 20, 2);
    overlays.push({
      id: "bb-middle",
      color: COLORS.bollinger,
      data: bands.map((p) => ({ time: p.time, value: p.middle })),
    });
    overlays.push({
      id: "bb-upper",
      color: COLORS.bollingerBand,
      dashed: true,
      data: bands.map((p) => ({ time: p.time, value: p.upper })),
    });
    overlays.push({
      id: "bb-lower",
      color: COLORS.bollingerBand,
      dashed: true,
      data: bands.map((p) => ({ time: p.time, value: p.lower })),
    });
  }

  return {
    overlays,
    rsi: state.rsi ? rsi(candles, 14) : null,
    macd: state.macd ? macd(candles, 12, 26, 9) : null,
  };
}
