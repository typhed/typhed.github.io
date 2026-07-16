/**
 * Serialise the IPO dataset to JSON and parse it back safely.
 *
 * The downloaded file is the portable, reusable artefact: it carries the schema
 * version and a save timestamp and drops ephemeral row ids. `safeParseIpoDataset`
 * guards BOTH the file import and the localStorage hydrate, so a hand-edited or
 * corrupt payload can never crash the page: it validates every field, coerces or
 * clamps what it can, drops malformed rows, and rejects only if nothing usable
 * remains. It never spreads the untrusted object (prototype-pollution-safe) - it
 * reads named fields and rebuilds a fresh dataset.
 */

import type { IpoDataset, IpoMeta } from "./types";
import { SCHEMA_VERSION } from "./types";
import { makeFinancialRow, makeGmpRow, makeMilestone } from "./defaults";

export type ParseResult =
  | { ok: true; data: IpoDataset }
  | { ok: false; error: string };

/** Serialise to pretty JSON: stamp schema/version + savedAt, strip row ids. */
export function serializeIpoDataset(data: IpoDataset): string {
  const clean = {
    meta: {
      companyName: data.meta.companyName,
      lotSize: data.meta.lotSize,
      priceBand: { min: data.meta.priceBand.min, max: data.meta.priceBand.max },
      currency: data.meta.currency,
      unitLabel: data.meta.unitLabel,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
    },
    timeline: data.timeline.map((m) => ({ label: m.label, date: m.date })),
    financials: data.financials.map((f) => ({
      period: f.period,
      totalAssets: f.totalAssets,
      grossRevenue: f.grossRevenue,
      pat: f.pat,
    })),
    gmp: data.gmp.map((g) => ({ date: g.date, value: g.value })),
  };
  return JSON.stringify(clean, null, 2);
}

/** Lowercase, dash-separated slug for filenames. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Download filename, e.g. `ipo-sample-ipo-2026-07-16.json`. */
export function ipoFileName(data: IpoDataset, today: string): string {
  const slug = slugify(data.meta.companyName) || "dashboard";
  const stamp = today || new Date().toISOString().slice(0, 10);
  return `ipo-${slug}-${stamp}.json`;
}

/* ------------------------------ validators ------------------------------ */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

/** Accept ISO "yyyy-mm-dd" as-is; coerce "dd-mm-yyyy" / "dd/mm/yyyy"; else null. */
function coerceIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

/**
 * Validate/clamp an untrusted payload into a fresh `IpoDataset`. Never spreads
 * the input; reads only named fields. Malformed rows are dropped, not fatal.
 */
export function safeParseIpoDataset(raw: unknown): ParseResult {
  if (!isObject(raw)) {
    return { ok: false, error: "This file isn't a valid IPO dashboard export." };
  }

  const metaRaw = isObject(raw.meta) ? raw.meta : {};
  const bandRaw = isObject(metaRaw.priceBand) ? metaRaw.priceBand : {};
  let bandMin = Math.max(0, num(bandRaw.min, 0));
  let bandMax = Math.max(0, num(bandRaw.max, 0));
  if (bandMin > bandMax) [bandMin, bandMax] = [bandMax, bandMin];

  const meta: IpoMeta = {
    companyName: str(metaRaw.companyName, "Untitled IPO"),
    lotSize: Math.max(1, Math.round(num(metaRaw.lotSize, 1))),
    priceBand: { min: bandMin, max: bandMax },
    currency: str(metaRaw.currency, "INR"),
    unitLabel: str(metaRaw.unitLabel, "Cr"),
    schemaVersion: SCHEMA_VERSION,
    savedAt: str(metaRaw.savedAt, ""),
  };

  const timeline = asArray(raw.timeline).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const date = coerceIsoDate(entry.date);
    if (date === null) return [];
    return [makeMilestone({ label: str(entry.label, "Milestone"), date })];
  });

  const financials = asArray(raw.financials).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const totalAssets = num(entry.totalAssets, NaN);
    const grossRevenue = num(entry.grossRevenue, NaN);
    const pat = num(entry.pat, NaN);
    if (!Number.isFinite(totalAssets) || !Number.isFinite(grossRevenue) || !Number.isFinite(pat)) {
      return [];
    }
    return [makeFinancialRow({ period: str(entry.period, "-"), totalAssets, grossRevenue, pat })];
  });

  const gmp = asArray(raw.gmp).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const date = coerceIsoDate(entry.date);
    const value = num(entry.value, NaN);
    if (date === null || !Number.isFinite(value)) return [];
    return [makeGmpRow({ date, value })];
  });

  if (timeline.length === 0 && financials.length === 0 && gmp.length === 0) {
    return { ok: false, error: "No usable IPO data found in this file." };
  }

  return { ok: true, data: { meta, timeline, financials, gmp } };
}
