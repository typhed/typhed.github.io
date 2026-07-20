import { ema, type Candle } from "@typhed/chart-engine";
import { maxDrawdown, mean } from "@typhed/risk-toolkit";

import { wilderAtr } from "./atr";
import type {
  BacktestParams,
  BacktestResult,
  BacktestTrade,
  ExitReason,
} from "./types";

/**
 * Long-only EMA swing backtest with three templates and non-negotiable
 * execution rules (see the research doc, Part C):
 *
 *   - Signals are evaluated on the close of bar t and filled at the open of
 *     bar t+1 - no lookahead anywhere; the EMA and ATR are both causal.
 *   - The intrabar ATR stop is approximated at the stop price; a bar that
 *     gaps below the stop fills at its open (the documented caveat).
 *   - Round-trip cost lands half on the entry price, half on the exit.
 *   - Position size is fixed-fractional over the ATR risk unit (the
 *     sizing.ts scheme), with fractional units so the study is scale-free.
 *   - A position still open at the last bar closes there, flagged
 *     "endOfData".
 *
 * Templates:
 *   - "pullback": trend filter close > EMA; entry when the bar touches the
 *     EMA intraday (low <= EMA) yet closes back above; exits on close < EMA,
 *     the ATR stop, or the holding cap.
 *   - "cross": close crossing above the EMA enters; crossing below exits.
 *   - "dualCross": fast EMA crossing over the slow enters; under exits.
 */
export function runBacktest(
  candles: readonly Candle[],
  params: BacktestParams,
): BacktestResult {
  const {
    template,
    emaPeriod,
    slowEmaPeriod,
    holdingCapBars,
    roundTripCostBps,
  } = params;

  if (!(roundTripCostBps > 0)) {
    throw new Error(
      "roundTripCostBps must be positive - a costless backtest is not offered.",
    );
  }
  if (!Number.isInteger(emaPeriod) || emaPeriod < 2) {
    throw new Error(`emaPeriod must be an integer >= 2, got ${emaPeriod}.`);
  }
  if (template === "dualCross") {
    if (
      slowEmaPeriod === undefined ||
      !Number.isInteger(slowEmaPeriod) ||
      slowEmaPeriod <= emaPeriod
    ) {
      throw new Error(
        "dualCross needs an integer slowEmaPeriod greater than emaPeriod.",
      );
    }
  }
  if (holdingCapBars < 0 || !Number.isInteger(holdingCapBars)) {
    throw new Error(`holdingCapBars must be a non-negative integer.`);
  }

  const atrPeriod = params.atrPeriod ?? 14;
  const startEquity = params.startEquity ?? 100000;
  const riskPercent = params.riskPercent ?? 1;
  const stopMultiple = params.atrStopMultiple ?? 2;
  const stopActive = stopMultiple > 0;
  const riskUnitMultiple = stopActive ? stopMultiple : 2;
  const costHalf = roundTripCostBps / 10000 / 2;

  const n = candles.length;
  const fast = ema(candles, emaPeriod).map((p) => p.value);
  const slow =
    template === "dualCross"
      ? ema(candles, slowEmaPeriod!).map((p) => p.value)
      : null;
  const atr = wilderAtr(candles, atrPeriod);

  const trades: BacktestTrade[] = [];
  const equity: number[] = new Array(n).fill(startEquity);

  let cash = startEquity;
  let position: {
    entryIndex: number;
    entryEff: number;
    quantity: number;
    stopPrice: number;
    riskPerUnit: number;
  } | null = null;
  let pendingEntry = false;
  let pendingExit: ExitReason | null = null;
  let barsExposed = 0;

  function closeTrade(exitIndex: number, exitRaw: number, reason: ExitReason) {
    const p = position!;
    const exitEff = exitRaw * (1 - costHalf);
    const pnl = p.quantity * (exitEff - p.entryEff);
    cash += pnl;
    trades.push({
      entryIndex: p.entryIndex,
      exitIndex,
      entryTime: candles[p.entryIndex]!.time,
      exitTime: candles[exitIndex]!.time,
      entryPrice: p.entryEff,
      exitPrice: exitEff,
      quantity: p.quantity,
      barsHeld: exitIndex - p.entryIndex,
      exitReason: reason,
      pnl,
      returnFraction: exitEff / p.entryEff - 1,
      rMultiple: (exitEff - p.entryEff) / p.riskPerUnit,
      riskPerUnit: p.riskPerUnit,
    });
    position = null;
  }

  for (let t = 0; t < n; t += 1) {
    const bar = candles[t]!;

    // 1. Fill a pending exit at this bar's open.
    if (pendingExit !== null && position !== null) {
      closeTrade(t, bar.open, pendingExit);
    }
    pendingExit = null;

    // 2. Fill a pending entry at this bar's open. The risk unit comes from
    //    the ATR known at the signal bar (t-1); still warming up -> skip.
    if (pendingEntry && position === null) {
      const signalAtr = t > 0 ? (atr[t - 1] ?? null) : null;
      if (signalAtr !== null && signalAtr > 0) {
        const riskPerUnit = riskUnitMultiple * signalAtr;
        const riskAmount = cash * (riskPercent / 100);
        position = {
          entryIndex: t,
          entryEff: bar.open * (1 + costHalf),
          quantity: riskAmount / riskPerUnit,
          stopPrice: stopActive
            ? bar.open - stopMultiple * signalAtr
            : Number.NEGATIVE_INFINITY,
          riskPerUnit,
        };
      }
    }
    pendingEntry = false;

    // 3. Intrabar ATR stop: fires during bar t at the stop price, or at the
    //    open when the bar gapped below it.
    if (position !== null && stopActive && bar.low <= position.stopPrice) {
      closeTrade(t, Math.min(bar.open, position.stopPrice), "stop");
    }

    // 4. Close-of-bar evaluation.
    const fastT = fast[t]!;
    const fastPrev = t > 0 ? fast[t - 1]! : fastT;
    const slowT = slow ? slow[t]! : 0;
    const slowPrev = slow ? (t > 0 ? slow[t - 1]! : slowT) : 0;

    if (position !== null) {
      barsExposed += 1;
      let exitSignal = false;
      if (template === "pullback" || template === "cross") {
        exitSignal = bar.close < fastT;
      } else {
        exitSignal = fastT < slowT;
      }
      if (exitSignal) {
        pendingExit = "signal";
      } else if (
        holdingCapBars > 0 &&
        t - position.entryIndex + 1 >= holdingCapBars
      ) {
        pendingExit = "time";
      }
    } else if (t >= emaPeriod) {
      // Entry signals only once the EMA has a full period behind it.
      let entrySignal = false;
      if (template === "pullback") {
        entrySignal = bar.low <= fastT && bar.close > fastT;
      } else if (template === "cross") {
        const prevClose = t > 0 ? candles[t - 1]!.close : bar.close;
        entrySignal = prevClose <= fastPrev && bar.close > fastT;
      } else {
        entrySignal = fastPrev <= slowPrev && fastT > slowT;
      }
      if (entrySignal && t < n - 1) pendingEntry = true;
    }

    // 5. Mark-to-market equity at this bar's close.
    equity[t] =
      cash +
      (position !== null
        ? position.quantity * (bar.close - position.entryEff)
        : 0);
  }

  // A position surviving the data closes on the last bar.
  if (position !== null) {
    closeTrade(n - 1, candles[n - 1]!.close, "endOfData");
    equity[n - 1] = cash;
  }

  const rMultiples = trades.map((trade) => trade.rMultiple);
  const wins = trades.filter((trade) => trade.pnl > 0).length;
  const grossProfit = trades.reduce(
    (sum, trade) => (trade.pnl > 0 ? sum + trade.pnl : sum),
    0,
  );
  const grossLoss = trades.reduce(
    (sum, trade) => (trade.pnl < 0 ? sum - trade.pnl : sum),
    0,
  );
  const endEquity = equity[n - 1] ?? startEquity;

  return {
    trades,
    equity,
    stats: {
      trades: trades.length,
      wins,
      winRate: trades.length > 0 ? wins / trades.length : 0,
      avgR: trades.length > 0 ? mean(rMultiples) : 0,
      expectancy:
        trades.length > 0
          ? trades.reduce((sum, trade) => sum + trade.pnl, 0) / trades.length
          : 0,
      profitFactor:
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      maxDrawdown: maxDrawdown(equity).maxDrawdown,
      exposure: n > 0 ? barsExposed / n : 0,
      totalReturn: endEquity / startEquity - 1,
      endEquity,
    },
    ema: fast,
    slowEma: slow,
  };
}
