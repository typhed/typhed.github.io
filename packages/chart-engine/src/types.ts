/**
 * Core domain types for the chart engine. Every time value is a UNIX timestamp
 * in **seconds, UTC** - the unit lightweight-charts expects and the only unit
 * used internally, so aggregation stays timezone-deterministic.
 */

/** UNIX timestamp in seconds, UTC. */
export type UTCTimestamp = number;

/** A single OHLC(V) candle. `volume` is null when the source has no volume. */
export interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

/** How raw timestamp cells are interpreted. */
export type TimeFormat = "auto" | "unix_s" | "unix_ms" | "excel" | "iso";

/** Maps source columns onto OHLCV fields. Volume is optional. */
export interface ColumnMapping {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
  timeFormat: TimeFormat;
}

/** A parsed tabular source before it is mapped to candles. */
export interface ParsedTable {
  headers: string[];
  rows: Array<Record<string, unknown>>;
}
