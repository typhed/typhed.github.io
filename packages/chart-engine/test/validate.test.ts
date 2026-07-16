import { describe, expect, it } from "vitest";

import { validateCandles, type Candle } from "../src";

function bar(
  time: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number | null = 100,
): Candle {
  return { time, open, high, low, close, volume };
}

describe("validateCandles", () => {
  it("accepts a clean, ordered series", () => {
    const result = validateCandles([
      bar(60, 10, 12, 9, 11),
      bar(120, 11, 13, 10, 12),
    ]);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.stats.outputRows).toBe(2);
  });

  it("sorts out-of-order rows and flags the reordering", () => {
    const result = validateCandles([
      bar(120, 11, 13, 10, 12),
      bar(60, 10, 12, 9, 11),
    ]);
    expect(result.stats.reordered).toBe(true);
    expect(result.candles.map((c) => c.time)).toEqual([60, 120]);
    expect(result.issues.some((i) => i.code === "reordered")).toBe(true);
  });

  it("drops duplicate timestamps, keeping the last", () => {
    const result = validateCandles([
      bar(60, 10, 12, 9, 11),
      bar(60, 20, 22, 19, 21),
      bar(120, 21, 23, 20, 22),
    ]);
    expect(result.stats.duplicatesDropped).toBe(1);
    expect(result.candles).toHaveLength(2);
    expect(result.candles[0]!.open).toBe(20);
  });

  it("flags high below low", () => {
    const result = validateCandles([bar(60, 10, 8, 9, 9)]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "high_below_low")).toBe(true);
  });

  it("flags high below the body and low above the body", () => {
    const highResult = validateCandles([bar(60, 10, 10.5, 9, 11)]);
    expect(highResult.issues.some((i) => i.code === "high_below_body")).toBe(true);

    const lowResult = validateCandles([bar(60, 10, 12, 10.5, 9)]);
    expect(lowResult.issues.some((i) => i.code === "low_above_body")).toBe(true);
  });

  it("flags negative volume", () => {
    const result = validateCandles([bar(60, 10, 12, 9, 11, -5)]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "negative_volume")).toBe(true);
  });

  it("reports no volume when the source omits it", () => {
    const result = validateCandles([bar(60, 10, 12, 9, 11, null)]);
    expect(result.stats.hasVolume).toBe(false);
  });
});
