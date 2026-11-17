import type { UTCTimestamp } from "../types"

export type TimeframeUnit = "minute" | "hour" | "day" | "week"

export interface Timeframe {
  /** Stable id, e.g. "5m", "1h", "1D". */
  id: string
  /** Human label, e.g. "5 minutes". */
  label: string
  /** Bucket size in seconds. */
  seconds: number
  unit: TimeframeUnit
}

/**
 * Supported timeframes, ascending. Intraday and daily buckets are aligned to
 * the UNIX epoch in UTC (floor to a multiple of `seconds`), which matches
 * pandas `resample(rule, origin="epoch", closed="left", label="left")`. Weekly
 * buckets are anchored to Monday 00:00 UTC instead (see `bucketStart`).
 */
export const TIMEFRAMES: readonly Timeframe[] = [
  { id: "1m", label: "1 minute", seconds: 60, unit: "minute" },
  { id: "3m", label: "3 minutes", seconds: 180, unit: "minute" },
  { id: "5m", label: "5 minutes", seconds: 300, unit: "minute" },
  { id: "15m", label: "15 minutes", seconds: 900, unit: "minute" },
  { id: "30m", label: "30 minutes", seconds: 1800, unit: "minute" },
  { id: "1h", label: "1 hour", seconds: 3600, unit: "hour" },
  { id: "2h", label: "2 hours", seconds: 7200, unit: "hour" },
  { id: "4h", label: "4 hours", seconds: 14400, unit: "hour" },
  { id: "1D", label: "1 day", seconds: 86400, unit: "day" },
  { id: "1W", label: "1 week", seconds: 604800, unit: "week" },
] as const

const SECONDS_PER_DAY = 86400

export function timeframeById(id: string): Timeframe | undefined {
  return TIMEFRAMES.find((tf) => tf.id === id)
}

/**
 * Start of the bucket that `time` falls into for the given timeframe. Intraday
 * and daily use epoch-aligned flooring; weekly anchors to Monday 00:00 UTC.
 * Epoch day 0 (1970-01-01) was a Thursday, so Monday index = (day + 3) % 7.
 */
export function bucketStart(time: UTCTimestamp, tf: Timeframe): UTCTimestamp {
  if (tf.unit === "week") {
    const day = Math.floor(time / SECONDS_PER_DAY)
    const weekdayFromMonday = (((day + 3) % 7) + 7) % 7
    return (day - weekdayFromMonday) * SECONDS_PER_DAY
  }
  return Math.floor(time / tf.seconds) * tf.seconds
}

/**
 * Whether `target` is a valid higher timeframe to aggregate `base` into. A
 * target must be strictly larger and, for clean nesting, a whole multiple of
 * the base (weekly is always allowed since 604800 is a multiple of a day/hour).
 */
export function canAggregate(base: Timeframe, target: Timeframe): boolean {
  if (target.seconds <= base.seconds) return false
  return target.seconds % base.seconds === 0
}
