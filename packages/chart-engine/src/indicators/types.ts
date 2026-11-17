import type { UTCTimestamp } from "../types";

/** A single indicator value at a point in time. */
export interface LinePoint {
  time: UTCTimestamp;
  value: number;
}

/** Bollinger band triple at a point in time. */
export interface BandPoint {
  time: UTCTimestamp;
  middle: number;
  upper: number;
  lower: number;
}

/** MACD line, signal line, and histogram at a point in time. */
export interface MacdPoint {
  time: UTCTimestamp;
  macd: number;
  signal: number;
  histogram: number;
}
