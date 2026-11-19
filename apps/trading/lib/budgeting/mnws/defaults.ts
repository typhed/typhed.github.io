/**
 * Seed dataset and row factories for the MNWS budgeting tool.
 *
 * `DEFAULT_MNWS_DATASET` is a realistic ~10-year salary journey (echoing the
 * worked example: a first salary dated 2016-11-30 and the first raise dated
 * 2017-07-31) plus two windfalls, so the page renders a complete, illustrative
 * corpus curve on first visit. "Reset" instead clears to `blankMnwsDataset`,
 * an empty plan the user fills in row by row. The factories mint fresh row
 * ids for add/remove edits and for rows rebuilt by the JSON parser.
 */

import { newId } from "@/lib/id"
import { DEFAULT_ANNUAL_RETURN_PCT, DEFAULT_BONUS_SPLIT, SCHEMA_VERSION } from "./types"
import type { BonusEntry, MnwsDataset, SalaryEntry } from "./types"

export function makeSalaryEntry(init: Omit<SalaryEntry, "id">): SalaryEntry {
  return { id: newId(), ...init }
}

export function makeBonusEntry(init: Omit<BonusEntry, "id">): BonusEntry {
  return { id: newId(), ...init }
}

/** A blank bonus row seeded with the default 25 / 0 / 75 split. */
export function blankBonusEntry(date: string): BonusEntry {
  return makeBonusEntry({
    date,
    amount: 0,
    needsPct: DEFAULT_BONUS_SPLIT.needs,
    wantsPct: DEFAULT_BONUS_SPLIT.wants,
    savingsPct: DEFAULT_BONUS_SPLIT.savings,
    note: "",
  })
}

/** An empty plan: what "Reset" clears to, filled in by the user row by row. */
export function blankMnwsDataset(): MnwsDataset {
  return {
    meta: {
      planName: "My 50-30-20 Plan",
      schemaVersion: SCHEMA_VERSION,
      savedAt: "",
    },
    salaries: [],
    bonuses: [],
    settings: {
      annualReturnPct: DEFAULT_ANNUAL_RETURN_PCT,
    },
  }
}

/** The seed plan: a disciplined ten-year salary journey with two windfalls. */
export function defaultMnwsDataset(): MnwsDataset {
  return {
    meta: {
      planName: "My 50-30-20 Plan",
      schemaVersion: SCHEMA_VERSION,
      savedAt: "",
    },
    salaries: [
      makeSalaryEntry({
        date: "2016-11-30",
        amount: 45000,
        note: "First salary",
      }),
      makeSalaryEntry({
        date: "2017-07-31",
        amount: 52000,
        note: "First appraisal",
      }),
      makeSalaryEntry({ date: "2018-08-31", amount: 63000, note: "Appraisal" }),
      makeSalaryEntry({
        date: "2020-04-30",
        amount: 82000,
        note: "Switch + hike",
      }),
      makeSalaryEntry({
        date: "2022-06-30",
        amount: 108000,
        note: "Promotion",
      }),
      makeSalaryEntry({
        date: "2024-05-31",
        amount: 150000,
        note: "Senior role",
      }),
    ],
    bonuses: [
      makeBonusEntry({
        date: "2019-10-31",
        amount: 150000,
        needsPct: DEFAULT_BONUS_SPLIT.needs,
        wantsPct: DEFAULT_BONUS_SPLIT.wants,
        savingsPct: DEFAULT_BONUS_SPLIT.savings,
        note: "Diwali bonus",
      }),
      makeBonusEntry({
        date: "2023-03-31",
        amount: 250000,
        needsPct: DEFAULT_BONUS_SPLIT.needs,
        wantsPct: DEFAULT_BONUS_SPLIT.wants,
        savingsPct: DEFAULT_BONUS_SPLIT.savings,
        note: "FD maturity",
      }),
    ],
    settings: {
      annualReturnPct: DEFAULT_ANNUAL_RETURN_PCT,
    },
  }
}

/** A ready-made instance for initial React state / SSR (deterministic-enough ids). */
export const DEFAULT_MNWS_DATASET: MnwsDataset = defaultMnwsDataset()
