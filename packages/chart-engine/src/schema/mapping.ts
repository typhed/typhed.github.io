import type { Candle, ColumnMapping, ParsedTable } from "../types";
import { parseTimestamp } from "./time";

interface FieldPattern {
  field: keyof Omit<ColumnMapping, "timeFormat">;
  pattern: RegExp;
}

// Ordered so specific names win before generic ones.
const FIELD_PATTERNS: FieldPattern[] = [
  { field: "time", pattern: /^(time|date|datetime|timestamp|dt)$/i },
  { field: "open", pattern: /^(open|o)$/i },
  { field: "high", pattern: /^(high|h|max)$/i },
  { field: "low", pattern: /^(low|l|min)$/i },
  { field: "close", pattern: /^(close|c|last|price|adj[_ ]?close)$/i },
  { field: "volume", pattern: /^(volume|vol|v|qty|quantity)$/i },
];

/**
 * Best-effort mapping from column headers to OHLCV fields. Nothing is assumed
 * silently - the caller presents this as a suggestion the user confirms.
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    time: "",
    open: "",
    high: "",
    low: "",
    close: "",
    volume: null,
    timeFormat: "auto",
  };

  for (const header of headers) {
    for (const { field, pattern } of FIELD_PATTERNS) {
      if (!pattern.test(header.trim())) continue;
      if (field === "volume") {
        if (mapping.volume === null) mapping.volume = header;
      } else if (mapping[field] === "") {
        mapping[field] = header;
      }
    }
  }

  return mapping;
}

/** Fields that must be mapped before candles can be built. */
export function missingRequiredFields(mapping: ColumnMapping): string[] {
  return (["time", "open", "high", "low", "close"] as const).filter(
    (field) => mapping[field] === "",
  );
}

export interface MapRowIssue {
  row: number;
  reason: string;
}

export interface MapResult {
  candles: Candle[];
  /** Rows dropped because a value could not be parsed. */
  issues: MapRowIssue[];
}

function toNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const text = String(raw ?? "").trim().replace(/,/g, "");
  if (text === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/**
 * Convert a parsed table into candles using the mapping. Rows with an
 * unparseable timestamp or OHLC value are dropped and reported, never guessed.
 */
export function toCandles(table: ParsedTable, mapping: ColumnMapping): MapResult {
  const candles: Candle[] = [];
  const issues: MapRowIssue[] = [];

  table.rows.forEach((row, index) => {
    const time = parseTimestamp(row[mapping.time], mapping.timeFormat);
    if (time === null) {
      issues.push({ row: index, reason: "unparseable timestamp" });
      return;
    }

    const open = toNumber(row[mapping.open]);
    const high = toNumber(row[mapping.high]);
    const low = toNumber(row[mapping.low]);
    const close = toNumber(row[mapping.close]);

    if (open === null || high === null || low === null || close === null) {
      issues.push({ row: index, reason: "unparseable OHLC value" });
      return;
    }

    let volume: number | null = null;
    if (mapping.volume !== null) {
      volume = toNumber(row[mapping.volume]);
      if (volume === null) {
        issues.push({ row: index, reason: "unparseable volume" });
        return;
      }
    }

    candles.push({ time, open, high, low, close, volume });
  });

  return { candles, issues };
}
