import { describe, expect, it } from "vitest";
import type { Candle } from "@typhed/chart-engine";
import { mulberry32, normalSampler } from "@typhed/risk-toolkit";

import { runBacktest, wilderAtr, type BacktestParams } from "../src";

/** Seeded trending random-walk candles - the golden fixture generator. */
function syntheticCandles(n: number, seed: number, drift = 0.0006): Candle[] {
  const normal = normalSampler(mulberry32(seed));
  const rand = mulberry32(seed + 1);
  const candles: Candle[] = [];
  let close = 100;
  for (let i = 0; i < n; i += 1) {
    const open = close * (1 + 0.002 * (rand() - 0.5));
    const next = close * Math.exp(drift + 0.012 * normal());
    const high = Math.max(open, next) * (1 + 0.004 * rand());
    const low = Math.min(open, next) * (1 - 0.004 * rand());
    candles.push({ time: 86400 * (i + 1), open, high, low, close: next, volume: null });
    close = next;
  }
  return candles;
}

const BASE: BacktestParams = {
  template: "pullback",
  emaPeriod: 20,
  holdingCapBars: 10,
  roundTripCostBps: 20,
};

const CANDLES = syntheticCandles(350, 7);

describe("runBacktest", () => {
  it("refuses a costless backtest and a bad dual-cross grid", () => {
    expect(() =>
      runBacktest(CANDLES, { ...BASE, roundTripCostBps: 0 }),
    ).toThrow(/costless/);
    expect(() =>
      runBacktest(CANDLES, {
        ...BASE,
        template: "dualCross",
        slowEmaPeriod: BASE.emaPeriod,
      }),
    ).toThrow(/slowEmaPeriod/);
  });

  it("never looks ahead: appending bars cannot change closed past trades", () => {
    const short = runBacktest(CANDLES.slice(0, 300), BASE);
    const long = runBacktest(CANDLES, BASE);

    const closedEarly = (trades: typeof short.trades) =>
      trades.filter(
        (t) => t.exitIndex < 298 && t.exitReason !== "endOfData",
      );

    expect(closedEarly(long.trades)).toEqual(closedEarly(short.trades));
  });

  it("fills a pullback entry at the next bar's open with the half cost", () => {
    const result = runBacktest(CANDLES, BASE);
    expect(result.trades.length).toBeGreaterThan(0);

    const costHalf = BASE.roundTripCostBps / 10000 / 2;
    for (const trade of result.trades) {
      const fillBar = CANDLES[trade.entryIndex]!;
      expect(trade.entryPrice).toBeCloseTo(fillBar.open * (1 + costHalf), 10);

      // The signal bar (entryIndex - 1) touched the EMA and closed above it.
      const signalIndex = trade.entryIndex - 1;
      const emaAtSignal = result.ema[signalIndex]!;
      const signalBar = CANDLES[signalIndex]!;
      expect(signalBar.low).toBeLessThanOrEqual(emaAtSignal);
      expect(signalBar.close).toBeGreaterThan(emaAtSignal);
    }
  });

  it("enforces the holding cap for every trade", () => {
    for (const cap of [3, 5, 20]) {
      const result = runBacktest(CANDLES, { ...BASE, holdingCapBars: cap });
      for (const trade of result.trades) {
        expect(trade.barsHeld).toBeLessThanOrEqual(cap);
      }
    }
    const capped = runBacktest(CANDLES, { ...BASE, holdingCapBars: 3 });
    expect(capped.trades.some((t) => t.exitReason === "time")).toBe(true);
  });

  it("costs bite: a higher round-trip cost never improves the outcome", () => {
    const cheap = runBacktest(CANDLES, { ...BASE, roundTripCostBps: 10 });
    const dear = runBacktest(CANDLES, { ...BASE, roundTripCostBps: 100 });
    expect(dear.stats.endEquity).toBeLessThan(cheap.stats.endEquity);
    expect(dear.stats.avgR).toBeLessThan(cheap.stats.avgR);
  });

  it("exits at the ATR stop, or at the open when the bar gaps below it", () => {
    // A steady uptrend, one pullback entry, then a crash bar through the stop.
    const candles: Candle[] = [];
    let price = 100;
    for (let i = 0; i < 40; i += 1) {
      price *= 1.004;
      candles.push({
        time: 86400 * (i + 1),
        open: price * 0.999,
        high: price * 1.002,
        low: price * 0.997,
        close: price,
        volume: null,
      });
    }
    // Touch bar: dips to the EMA, closes back above -> entry next open.
    const touch = { ...candles[39]! };
    touch.low = touch.close * 0.96;
    candles[39] = touch;
    // Entry fill bar, then the crash.
    price *= 1.002;
    candles.push({
      time: 86400 * 41,
      open: price,
      high: price * 1.001,
      low: price * 0.999,
      close: price,
      volume: null,
    });
    candles.push({
      time: 86400 * 42,
      open: price * 0.98,
      high: price * 0.985,
      low: price * 0.7,
      close: price * 0.75,
      volume: null,
    });

    const result = runBacktest(candles, {
      ...BASE,
      emaPeriod: 10,
      holdingCapBars: 20,
      atrStopMultiple: 2,
    });
    const stopped = result.trades.find((t) => t.exitReason === "stop");
    expect(stopped).toBeDefined();
    expect(stopped!.rMultiple).toBeLessThan(0);
    // The stop fill never exceeds the bar's open or undercuts its low.
    const exitBar = candles[stopped!.exitIndex]!;
    const rawExit = stopped!.exitPrice / (1 - BASE.roundTripCostBps / 10000 / 2);
    expect(rawExit).toBeLessThanOrEqual(exitBar.open + 1e-9);
    expect(rawExit).toBeGreaterThanOrEqual(exitBar.low - 1e-9);
  });

  it("keeps the equity ledger consistent with the trade P&L", () => {
    const result = runBacktest(CANDLES, BASE);
    const startEquity = 100000;
    const totalPnl = result.trades.reduce((sum, t) => sum + t.pnl, 0);
    expect(result.stats.endEquity).toBeCloseTo(startEquity + totalPnl, 6);
    expect(result.stats.totalReturn).toBeCloseTo(totalPnl / startEquity, 6);
    expect(result.equity).toHaveLength(CANDLES.length);
  });

  it("runs all three templates and reports coherent stats", () => {
    for (const params of [
      BASE,
      { ...BASE, template: "cross" as const },
      { ...BASE, template: "dualCross" as const, emaPeriod: 9, slowEmaPeriod: 21 },
    ]) {
      const result = runBacktest(CANDLES, params);
      expect(result.stats.winRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.winRate).toBeLessThanOrEqual(1);
      expect(result.stats.exposure).toBeGreaterThanOrEqual(0);
      expect(result.stats.exposure).toBeLessThanOrEqual(1);
      expect(result.stats.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.ema).toHaveLength(CANDLES.length);
      for (const trade of result.trades) {
        expect(trade.exitIndex).toBeGreaterThanOrEqual(trade.entryIndex);
      }
    }
  });

  it("golden fixture: seeded stats stay bit-stable", () => {
    const pullback = runBacktest(CANDLES, BASE);
    const dual = runBacktest(CANDLES, {
      ...BASE,
      template: "dualCross",
      emaPeriod: 9,
      slowEmaPeriod: 21,
    });

    // Captured at ES1; a change here is a contract break.
    expect(pullback.stats.trades).toMatchInlineSnapshot(`21`);
    expect(pullback.stats.winRate).toMatchInlineSnapshot(`0.3333333333333333`);
    expect(pullback.stats.endEquity).toMatchInlineSnapshot(`102541.82931640004`);
    expect(dual.stats.trades).toMatchInlineSnapshot(`9`);
    expect(dual.stats.endEquity).toMatchInlineSnapshot(`94897.6459407509`);
  });
});

describe("wilderAtr", () => {
  it("is causal, null through warm-up, positive afterwards", () => {
    const atr = wilderAtr(CANDLES, 14);
    expect(atr[0]).toBeNull();
    expect(atr[13]).toBeNull();
    expect(atr[14]).toBeGreaterThan(0);

    // Appending bars never changes earlier values.
    const shortAtr = wilderAtr(CANDLES.slice(0, 100), 14);
    for (let i = 0; i < 100; i += 1) {
      expect(atr[i]).toBe(shortAtr[i]);
    }
  });
});
