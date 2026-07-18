/**
 * Month arithmetic for the MNWS engine.
 *
 * The engine walks a calendar month-by-month, so months are represented as a
 * single integer INDEX (`year * 12 + (month - 1)`). That makes "next month" a
 * `+ 1`, ordering a numeric compare, and the span between two months a
 * subtraction - all without ever constructing a `Date` (which would break the
 * deterministic static export). Everything is derived from ISO "yyyy-mm-dd"
 * (or "yyyy-mm") strings; the day-of-month is intentionally ignored.
 */

export interface YearMonth {
  year: number;
  /** 1-12. */
  month: number;
}

/** Parse the year+month out of an ISO "yyyy-mm-dd" / "yyyy-mm" string, else null. */
export function ymFromIso(iso: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

/** Collapse a year+month to a single sortable integer index. */
export function ymToIndex(ym: YearMonth): number {
  return ym.year * 12 + (ym.month - 1);
}

/** Expand a month index back to a year+month. */
export function indexToYm(index: number): YearMonth {
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** The month index for an ISO date, or null when unparseable. */
export function monthIndexFromIso(iso: string): number | null {
  const ym = ymFromIso(iso);
  return ym === null ? null : ymToIndex(ym);
}

/** The index of the month AFTER the given ISO date's month (allocation start). */
export function monthAfterIso(iso: string): number | null {
  const index = monthIndexFromIso(iso);
  return index === null ? null : index + 1;
}

/** "yyyy-mm" key for a month index, e.g. `-> "2016-12"`. */
export function indexToKey(index: number): string {
  const { year, month } = indexToYm(index);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** First-of-month ISO date for a month index, e.g. `-> "2016-12-01"`. */
export function indexToIso(index: number): string {
  return `${indexToKey(index)}-01`;
}

/** Calendar year for a month index. */
export function indexToYear(index: number): number {
  return Math.floor(index / 12);
}

/** Ascending comparator for ISO "yyyy-mm-dd" / "yyyy-mm" strings (lexicographic works). */
export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
