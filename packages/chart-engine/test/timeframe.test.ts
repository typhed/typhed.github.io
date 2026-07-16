import { describe, expect, it } from "vitest";

import { bucketStart, canAggregate, timeframeById } from "../src";

const secs = (ms: number): number => ms / 1000;

describe("bucketStart", () => {
  it("floors intraday and daily to epoch-aligned buckets (UTC)", () => {
    const t = secs(Date.UTC(2024, 0, 1, 10, 7, 30));
    expect(bucketStart(t, timeframeById("5m")!)).toBe(
      secs(Date.UTC(2024, 0, 1, 10, 5)),
    );
    expect(bucketStart(t, timeframeById("1h")!)).toBe(
      secs(Date.UTC(2024, 0, 1, 10)),
    );
    expect(bucketStart(t, timeframeById("4h")!)).toBe(
      secs(Date.UTC(2024, 0, 1, 8)),
    );
    expect(bucketStart(t, timeframeById("1D")!)).toBe(
      secs(Date.UTC(2024, 0, 1)),
    );
  });

  it("anchors weekly buckets to Monday 00:00 UTC", () => {
    const week = timeframeById("1W")!;
    const monday = secs(Date.UTC(2024, 0, 1)); // 2024-01-01 is a Monday
    expect(bucketStart(secs(Date.UTC(2024, 0, 3, 15)), week)).toBe(monday);
    expect(bucketStart(secs(Date.UTC(2024, 0, 7, 23, 59)), week)).toBe(monday);
    expect(bucketStart(secs(Date.UTC(2024, 0, 8)), week)).toBe(
      secs(Date.UTC(2024, 0, 8)),
    );
  });
});

describe("canAggregate", () => {
  it("permits whole-multiple higher timeframes only", () => {
    expect(canAggregate(timeframeById("1m")!, timeframeById("5m")!)).toBe(true);
    expect(canAggregate(timeframeById("5m")!, timeframeById("15m")!)).toBe(true);
    expect(canAggregate(timeframeById("5m")!, timeframeById("1m")!)).toBe(false);
    expect(canAggregate(timeframeById("1h")!, timeframeById("1h")!)).toBe(false);
  });
});
