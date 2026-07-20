export type StrategyTemplate = "pullback" | "cross" | "dualCross";

export interface BacktestParams {
  template: StrategyTemplate;
  /** EMA period N; the fast period for "dualCross". */
  emaPeriod: number;
  /** Slow EMA period ("dualCross" only; must exceed emaPeriod). */
  slowEmaPeriod?: number;
  /**
   * Maximum bars from entry fill to exit fill - the 2-20 day swing cap.
   * 0 disables the time stop.
   */
  holdingCapBars: number;
  /**
   * Round-trip cost in basis points (brokerage + slippage), split half on
   * entry and half on exit. Required and never zero - a costless backtest
   * flatters every strategy.
   */
  roundTripCostBps: number;
  /**
   * ATR-multiple stop distance (default 2). 0 disables the stop exit; the
   * R-multiple risk unit then still uses a nominal 2-ATR distance so R
   * stays comparable across runs.
   */
  atrStopMultiple?: number;
  /** ATR period for the stop and the risk unit (default 14). */
  atrPeriod?: number;
  /** Starting account equity (default 100000). */
  startEquity?: number;
  /** Percent of equity risked per trade, fixed-fractional (default 1). */
  riskPercent?: number;
}

export type ExitReason = "signal" | "stop" | "time" | "endOfData";

export interface BacktestTrade {
  /** Bar index of the entry fill (the open of the bar after the signal). */
  entryIndex: number;
  exitIndex: number;
  entryTime: number;
  exitTime: number;
  /** Effective prices including the half-cost on each side. */
  entryPrice: number;
  exitPrice: number;
  /** Fractional units; the live sizer floors, the study stays scale-free. */
  quantity: number;
  barsHeld: number;
  exitReason: ExitReason;
  pnl: number;
  /** exit/entry - 1 on effective prices. */
  returnFraction: number;
  /** Per-unit net P&L over the per-unit risk at entry. */
  rMultiple: number;
  riskPerUnit: number;
}

export interface BacktestStats {
  trades: number;
  wins: number;
  winRate: number;
  avgR: number;
  /** Mean currency P&L per trade. */
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  /** Fraction of bars with an open position. */
  exposure: number;
  totalReturn: number;
  endEquity: number;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  /** Mark-to-market equity per bar (same length as the candles). */
  equity: number[];
  stats: BacktestStats;
  /** Per-bar EMA used by the strategy (chart overlay). */
  ema: number[];
  /** Per-bar slow EMA ("dualCross" only). */
  slowEma: number[] | null;
}
