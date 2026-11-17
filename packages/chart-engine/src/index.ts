export type { Candle, ColumnMapping, ParsedTable, TimeFormat, UTCTimestamp } from "./types"

export { parseCsv } from "./parse/csv"
export { parseXlsx } from "./parse/xlsx"

export { parseTimestamp } from "./schema/time"
export {
  autoDetectMapping,
  missingRequiredFields,
  toCandles,
  type MapResult,
  type MapRowIssue,
} from "./schema/mapping"
export {
  validateCandles,
  type IntegrityIssue,
  type IntegritySeverity,
  type ValidationResult,
} from "./schema/validate"

export {
  TIMEFRAMES,
  timeframeById,
  bucketStart,
  canAggregate,
  type Timeframe,
  type TimeframeUnit,
} from "./aggregate/timeframe"
export { aggregate } from "./aggregate/aggregate"
export { inferBaseIntervalSeconds, countMissingIntervals } from "./aggregate/interval"

export {
  sma,
  ema,
  emaSeries,
  bollinger,
  rsi,
  macd,
  type LinePoint,
  type BandPoint,
  type MacdPoint,
} from "./indicators"

import type { ColumnMapping, ParsedTable } from "./types"
import { toCandles } from "./schema/mapping"
import { validateCandles, type ValidationResult } from "./schema/validate"
import { type MapRowIssue } from "./schema/mapping"

export interface DatasetResult extends ValidationResult {
  /** Rows dropped during mapping (before validation). */
  mappingIssues: MapRowIssue[]
}

/**
 * One call from a parsed table to validated candles: map columns, then
 * validate and normalise. Mapping drops (unparseable rows) and validation
 * findings are both returned so the UI can show a complete integrity picture.
 */
export function buildDataset(table: ParsedTable, mapping: ColumnMapping): DatasetResult {
  const mapped = toCandles(table, mapping)
  const validated = validateCandles(mapped.candles)
  return { ...validated, mappingIssues: mapped.issues }
}
