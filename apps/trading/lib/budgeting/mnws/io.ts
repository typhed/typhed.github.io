/**
 * Serialise the MNWS dataset to JSON and parse it back safely.
 *
 * The downloaded file is the portable artefact: it carries the schema version
 * and a save timestamp and drops ephemeral row ids. `safeParseMnwsDataset`
 * guards BOTH the file import and the localStorage hydrate, so a hand-edited or
 * corrupt payload can never crash the page: it validates every field, coerces
 * or clamps what it can, drops malformed rows, and rejects only if no salary
 * and no bonus survive. The hydrate passes `allowEmpty` so an intentionally
 * cleared plan (after "Reset") round-trips instead of resurrecting the seed;
 * file import stays strict. It never spreads the untrusted object - it reads
 * named fields (via the shared `@/lib/parse` helpers) and rebuilds a fresh
 * dataset.
 */

import { slugify } from "@/lib/utils";
import { asArray, coerceIsoDate, isObject, num, str } from "@/lib/parse";
import {
  DEFAULT_ANNUAL_RETURN_PCT,
  DEFAULT_BONUS_SPLIT,
  RETURN_MAX,
  RETURN_MIN,
  SCHEMA_VERSION,
} from "./types";
import type { MnwsDataset } from "./types";
import { makeBonusEntry, makeSalaryEntry } from "./defaults";

export type ParseResult =
  { ok: true; data: MnwsDataset } | { ok: false; error: string };

/** Serialise to pretty JSON: stamp schema/version + savedAt, strip row ids. */
export function serializeMnwsDataset(data: MnwsDataset): string {
  const clean = {
    meta: {
      planName: data.meta.planName,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
    },
    settings: {
      annualReturnPct: data.settings.annualReturnPct,
    },
    salaries: data.salaries.map((s) => ({
      date: s.date,
      amount: s.amount,
      note: s.note,
    })),
    bonuses: data.bonuses.map((b) => ({
      date: b.date,
      amount: b.amount,
      needsPct: b.needsPct,
      wantsPct: b.wantsPct,
      savingsPct: b.savingsPct,
      note: b.note,
    })),
  };
  return JSON.stringify(clean, null, 2);
}

/** Download filename, e.g. `mnws-my-mnws-plan-2026-07-18.json`. */
export function mnwsFileName(data: MnwsDataset, today: string): string {
  const slug = slugify(data.meta.planName) || "plan";
  const stamp = today || new Date().toISOString().slice(0, 10);
  return `mnws-${slug}-${stamp}.json`;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Validate/clamp an untrusted payload into a fresh `MnwsDataset`. Never spreads
 * the input; reads only named fields. Malformed rows are dropped, not fatal.
 * `allowEmpty` accepts a dataset with no surviving rows (the hydrate path);
 * without it an empty result is rejected (the import path).
 */
export function safeParseMnwsDataset(
  raw: unknown,
  opts?: { allowEmpty?: boolean },
): ParseResult {
  if (!isObject(raw)) {
    return {
      ok: false,
      error: "This file isn't a valid 50-30-20 (modified) budgeting export.",
    };
  }

  const metaRaw = isObject(raw.meta) ? raw.meta : {};
  const settingsRaw = isObject(raw.settings) ? raw.settings : {};

  const salaries = asArray(raw.salaries).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const date = coerceIsoDate(entry.date);
    if (date === null) return [];
    return [
      makeSalaryEntry({
        date,
        amount: Math.max(0, num(entry.amount, 0)),
        note: str(entry.note, ""),
      }),
    ];
  });

  const bonuses = asArray(raw.bonuses).flatMap((entry) => {
    if (!isObject(entry)) return [];
    const date = coerceIsoDate(entry.date);
    if (date === null) return [];
    return [
      makeBonusEntry({
        date,
        amount: Math.max(0, num(entry.amount, 0)),
        needsPct: clamp(num(entry.needsPct, DEFAULT_BONUS_SPLIT.needs), 0, 100),
        wantsPct: clamp(num(entry.wantsPct, DEFAULT_BONUS_SPLIT.wants), 0, 100),
        savingsPct: clamp(
          num(entry.savingsPct, DEFAULT_BONUS_SPLIT.savings),
          0,
          100,
        ),
        note: str(entry.note, ""),
      }),
    ];
  });

  if (salaries.length === 0 && bonuses.length === 0 && !opts?.allowEmpty) {
    return {
      ok: false,
      error: "No usable salary or bonus entries found in this file.",
    };
  }

  const data: MnwsDataset = {
    meta: {
      planName: str(metaRaw.planName, "My 50-30-20 Plan"),
      schemaVersion: SCHEMA_VERSION,
      savedAt: str(metaRaw.savedAt, ""),
    },
    settings: {
      annualReturnPct: clamp(
        num(settingsRaw.annualReturnPct, DEFAULT_ANNUAL_RETURN_PCT),
        RETURN_MIN,
        RETURN_MAX,
      ),
    },
    salaries,
    bonuses,
  };

  return { ok: true, data };
}
