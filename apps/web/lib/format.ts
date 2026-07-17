/**
 * Shared number formatters for the tools UI. Every formatter pins the `en-IN`
 * locale: the IPO page is prerendered at build time, so a runtime-locale
 * formatter would bake the build machine's grouping into the static HTML and
 * mismatch at hydration on any other locale - and mixed lakh/crore vs western
 * grouping across one page reads as a defect in a numbers product.
 */

const LOCALE = "en-IN";

export function fmtMoney(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(LOCALE, {
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
  return value.toLocaleString(LOCALE, { maximumFractionDigits: digits });
}

/**
 * NaN-safe sign tone for stat tiles: positive for `>= 0`, negative below zero,
 * default when the value is missing (`NaN >= 0` is false, so a bare ternary
 * would paint missing values red).
 */
export function signTone(value: number): "positive" | "negative" | "default" {
  if (!Number.isFinite(value)) return "default";
  return value >= 0 ? "positive" : "negative";
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

/** Compact axis label: thousands collapse to "1.5K", smaller values round to integers. */
export function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${(value / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}K`;
  return value.toLocaleString(LOCALE, { maximumFractionDigits: 0 });
}

/** Render an ISO "yyyy-mm-dd" date as "dd-mm-yyyy" (matching the source sheet). */
export function fmtDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "-";
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
}

/** Short "dd Mon" label for chart axes, e.g. "14 Jul". */
export function fmtDayMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "-";
  const [, , mm, dd] = match;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(mm) - 1] ?? mm;
  return `${dd} ${month}`;
}
