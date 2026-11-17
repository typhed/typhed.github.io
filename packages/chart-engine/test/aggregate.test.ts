import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  aggregate,
  autoDetectMapping,
  buildDataset,
  parseCsv,
  timeframeById,
  type Candle,
} from "../src";

function loadText(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

const table = parseCsv(loadText("base_1m.csv"));
const mapping = autoDetectMapping(table.headers);
const dataset = buildDataset(table, mapping);

describe("chart-engine aggregation vs pandas golden fixtures", () => {
  it("auto-detects the OHLCV columns", () => {
    expect(mapping.time).toBe("time");
    expect(mapping.open).toBe("open");
    expect(mapping.high).toBe("high");
    expect(mapping.low).toBe("low");
    expect(mapping.close).toBe("close");
    expect(mapping.volume).toBe("volume");
  });

  it("produces a clean, validated base series", () => {
    expect(dataset.ok).toBe(true);
    expect(dataset.stats.hasVolume).toBe(true);
    expect(dataset.stats.duplicatesDropped).toBe(0);
    expect(dataset.mappingIssues).toHaveLength(0);
  });

  for (const tf of ["5m", "15m", "1h", "4h", "1D"]) {
    it(`aggregates 1m -> ${tf} exactly as pandas`, () => {
      const expected = loadJson<Candle[]>(`expected_${tf}.json`);
      const got = aggregate(dataset.candles, timeframeById(tf)!);

      expect(got).toHaveLength(expected.length);
      got.forEach((candle, index) => {
        const ref = expected[index]!;
        expect(candle.time).toBe(ref.time);
        expect(candle.open).toBeCloseTo(ref.open, 6);
        expect(candle.high).toBeCloseTo(ref.high, 6);
        expect(candle.low).toBeCloseTo(ref.low, 6);
        expect(candle.close).toBeCloseTo(ref.close, 6);
        expect(candle.volume ?? 0).toBeCloseTo(ref.volume ?? 0, 6);
      });
    });
  }

  it("drops empty buckets rather than interpolating gaps", () => {
    // The fixture removes a full hour, so no 1h candle should exist for it.
    const hourly = aggregate(dataset.candles, timeframeById("1h")!);
    const times = new Set(hourly.map((c) => c.time));
    // 600..660 minutes after 2024-01-01T00:00Z is the 10:00 UTC hour.
    const missingHour = Date.UTC(2024, 0, 1, 10) / 1000;
    expect(times.has(missingHour)).toBe(false);
  });
});
