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

import type { ApplicationType, IpoDataset, IpoMeta, SubscriptionCategory } from "./types";
import {
  APPLICATION_CATEGORIES,
  APPLICATION_TYPES,
  SCHEMA_VERSION,
  SUBSCRIPTION_CATEGORIES,
} from "./types";
import {
  makeApplication,
  makeContributor,
  makeFinancialRow,
  makeGmpRow,
  makeMilestone,
  makeSubscriptionRow,
} from "./defaults";

export type ParseResult =
  | { ok: true; data: IpoDataset }
  | { ok: false; error: string };

/** Serialise to pretty JSON: stamp schema/version + savedAt, strip row ids. */
export function serializeIpoDataset(data: IpoDataset): string {
  const clean = {
    meta: {
      companyName: data.meta.companyName,
      applicationType: data.meta.applicationType,
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
    applications: data.applications.map((a) => ({
      name: a.name,
      category: a.category,
      allotted: a.allotted,
      allotment: {
        quantityAllotted: a.allotment.quantityAllotted,
        sellingPrice: a.allotment.sellingPrice,
      },
      contributors: a.contributors.map((c) => ({ name: c.name, units: c.units, price: c.price })),
    })),
    subscription: data.subscription.map((s) => ({
      category: s.category,
      timesSubscribed: s.timesSubscribed,
    })),
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

/** Return `value` when it is one of `allowed`, else `fallback`. */
function enumOr<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
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
    applicationType: enumOr<ApplicationType>(metaRaw.applicationType, APPLICATION_TYPES, "MAINBOARD"),
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

  const applications = asArray(raw.applications).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const allotmentRaw = isObject(entry.allotment) ? entry.allotment : {};
    const contributors = asArray(entry.contributors).flatMap((c) => {
      if (!isObject(c)) return [];
      const units = num(c.units, NaN);
      const price = num(c.price, NaN);
      if (!Number.isFinite(units) || !Number.isFinite(price)) return [];
      return [
        makeContributor({ name: str(c.name, "Contributor"), units: Math.max(0, units), price: Math.max(0, price) }),
      ];
    });
    return [
      makeApplication({
        name: str(entry.name, "Application"),
        category: enumOr(entry.category, APPLICATION_CATEGORIES, "RETAIL"),
        allotted: entry.allotted === true,
        allotment: {
          quantityAllotted: Math.max(0, num(allotmentRaw.quantityAllotted, 0)),
          sellingPrice: Math.max(0, num(allotmentRaw.sellingPrice, 0)),
        },
        contributors,
      }),
    ];
  });

  const subscription = asArray(raw.subscription).flatMap((entry) => {
    if (!isObject(entry)) return [];
    if (!(SUBSCRIPTION_CATEGORIES as readonly string[]).includes(str(entry.category, ""))) return [];
    return [
      makeSubscriptionRow({
        category: entry.category as SubscriptionCategory,
        timesSubscribed: Math.max(0, num(entry.timesSubscribed, 0)),
      }),
    ];
  });

  if (
    timeline.length === 0 &&
    financials.length === 0 &&
    gmp.length === 0 &&
    applications.length === 0 &&
    subscription.length === 0
  ) {
    return { ok: false, error: "No usable IPO data found in this file." };
  }

  return { ok: true, data: { meta, timeline, financials, gmp, applications, subscription } };
}
