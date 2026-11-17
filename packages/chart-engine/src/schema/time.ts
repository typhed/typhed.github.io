import type { TimeFormat, UTCTimestamp } from "../types";

/** Days between the Excel epoch (1899-12-30) and the UNIX epoch (1970-01-01). */
const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const SECONDS_PER_DAY = 86400;

/**
 * The only date-time string shape accepted: ISO-8601 `yyyy-mm-dd`, optionally
 * followed by a `T`- or space-separated `hh:mm[:ss[.fff]]` and an optional
 * zone (`Z` or `+/-hh[:]mm`). Everything else - `01/02/2024`, `5 Jan 2024`,
 * RFC-2822 - is rejected rather than guessed: those shapes are either
 * locale-ambiguous (MM/DD vs DD/MM) or parse differently per JS engine, and
 * decision-grade candles must never depend on the machine that parsed them.
 */
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(z|[+-]\d{2}:?\d{2})?)?$/i;

/**
 * Parse one timestamp cell into UNIX seconds (UTC), or null if unparseable.
 *
 * Determinism note: a date-time string WITHOUT an explicit timezone is treated
 * as UTC, not local time, and only the ISO shape above is accepted at all -
 * so the same file yields the same candles on every machine, or a clear
 * per-row error. The assumed timezone is surfaced in the Data Integrity
 * panel.
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

  if (!ISO_DATE_TIME.test(text)) return null;

  const isoish = text.replace(" ", "T");
  const hasTime = isoish.includes("T");
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(isoish);
  const normalised = !hasTime
    ? `${isoish}T00:00:00Z`
    : hasZone
      ? // Zone offsets without a colon ("+0530") parse inconsistently across
        // engines; normalise to "+05:30".
        isoish.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")
      : `${isoish}Z`;

  const ms = Date.parse(normalised);
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
      // Heuristic ranges: ms since epoch (2001+), then seconds since epoch
      // (2001+), then an Excel serial date (60..80000 -> years 1900..2119,
      // starting past the Feb-1900 leap-year bug region). Values in the
      // 80000..1e9 gap are ambiguous (pre-2001 unix seconds vs far-future
      // Excel serials) and deliberately return null - declare an explicit
      // `unix_s` / `unix_ms` format for pre-2001 history.
      if (value >= 1e12) return Math.floor(value / 1000);
      if (value >= 1e9) return Math.floor(value);
      if (value > 59 && value < 80000) {
        return Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * SECONDS_PER_DAY);
      }
      return null;
  }
}

