/** Shared number formatters for the tools UI. */

export function fmtMoney(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPercent(fraction: number, digits = 2): string {
  if (!Number.isFinite(fraction)) return "-";
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function fmtNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Indian-rupee currency with lakh/crore grouping, e.g. `₹14,924.00`. */
export function fmtInr(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Compact Indian-rupee label for chart axes, e.g. `₹1.2Cr`, `₹6.5L`, `₹45k`. */
export function fmtInrShort(value: number): string {
  if (!Number.isFinite(value)) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const compact = (n: number) => (n >= 10 ? String(Math.round(n)) : n.toFixed(1));
  if (abs >= 1e7) return `${sign}₹${compact(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${compact(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

/** Render an ISO "yyyy-mm-dd" date as "dd-mm-yyyy" (matching the source sheet). */
export function fmtDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "-";
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Short "dd Mon" label for chart axes, e.g. "14 Jul". */
export function fmtDayMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "-";
  const [, , mm, dd] = match;
  const month = MONTH_ABBREVIATIONS[Number(mm) - 1] ?? mm;
  return `${dd} ${month}`;
}

/** Short "Mon'YY" month label, e.g. "Dec'16". Accepts ISO "yyyy-mm-dd" or "yyyy-mm". */
export function fmtMonthYear(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return iso || "-";
  const [, yyyy, mm] = match;
  const month = MONTH_ABBREVIATIONS[Number(mm) - 1] ?? mm;
  return `${month}'${(yyyy ?? "").slice(2)}`;
}
