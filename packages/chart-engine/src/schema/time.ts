import type { TimeFormat, UTCTimestamp } from "../types";

/** Days between the Excel epoch (1899-12-30) and the UNIX epoch (1970-01-01). */
const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const SECONDS_PER_DAY = 86400;

/**
 * Parse one timestamp cell into UNIX seconds (UTC), or null if unparseable.
 *
 * Determinism note: a date-time string WITHOUT an explicit timezone is treated
 * as UTC, not local time. Native `Date.parse("2024-01-01 09:15:00")` is
 * local-time and implementation-defined; we normalise such strings to append a
 * `Z` so the same file yields the same candles on every machine. The assumed
 * timezone is surfaced to the user in the Data Integrity panel.
 */
export function parseTimestamp(
  raw: unknown,
  format: TimeFormat,
): UTCTimestamp | null {
  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  }

  if (typeof raw === "number") {
    return parseNumeric(raw, format);
  }

  const text = String(raw).trim();
  if (text === "") return null;

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return parseNumeric(Number(text), format);
  }

  const iso = normaliseToUtcIso(text);
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function parseNumeric(value: number, format: TimeFormat): UTCTimestamp | null {
  if (!Number.isFinite(value)) return null;

  switch (format) {
    case "unix_s":
      return Math.floor(value);
    case "unix_ms":
      return Math.floor(value / 1000);
    case "excel":
      return Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * SECONDS_PER_DAY);
    case "iso":
      return null; // an ISO format was declared but a bare number was given
    case "auto":
    default:
      // Heuristic ranges: ms since epoch, then seconds since epoch, then an
      // Excel serial date (roughly 1..60000 -> years 1900..2064).
      if (value >= 1e12) return Math.floor(value / 1000);
      if (value >= 1e9) return Math.floor(value);
      if (value > 59 && value < 80000) {
        return Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * SECONDS_PER_DAY);
      }
      return null;
  }
}

/**
 * Normalise a date-time string toward an ISO-8601 UTC string. If it already
 * carries a `Z` or a numeric offset it is returned unchanged; otherwise a `Z`
 * is appended (and a space between date and time becomes `T`).
 */
function normaliseToUtcIso(text: string): string {
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(text);
  if (hasZone) return text;

  const isoish = text.replace(" ", "T");
  // Only append Z when it looks like an ISO date or date-time; leave other
  // formats (e.g. "01/02/2024") to Date.parse, which stays best-effort.
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?)?$/.test(isoish)) {
    return `${isoish}Z`;
  }
  return text;
}
