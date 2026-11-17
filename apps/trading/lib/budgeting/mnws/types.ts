/**
 * Data model for the static MNWS budgeting tool (`/budgeting/mnws`).
 *
 * MNWS = the "Modified Needs / Wants / Savings" rule. The classic 50-30-20 rule
 * applies to the very first salary; every later salary increment is split in the
 * REVERSE ratio (20-30-50) and added on top, so the recurring savings rate drifts
 * upward as income grows. See `engine.ts` for the exact maths.
 *
 * The dataset is the single source of truth: it is what the page renders, what
 * the user edits, and what is written to / read from the downloadable JSON file
 * and browser localStorage. Keep it JSON-serialisable and free of React types.
 */

/** Bumped whenever the on-disk JSON shape changes; drives `safeParseMnwsDataset`. */
export const SCHEMA_VERSION = 1

/** localStorage key holding the last-edited dataset for this browser. */
export const MNWS_STORAGE_KEY = "typhed:mnws:v1"

/**
 * Fixed base allocation applied to the FIRST salary (fractions summing to 1).
 * These are constants by design - only the per-bonus split is user-editable.
 */
export const BASE_SPLIT = { needs: 0.5, wants: 0.3, savings: 0.2 } as const

/**
 * Fixed reverse allocation applied to each salary INCREMENT (fractions summing
 * to 1). Because wants is 0.30 in both splits, the recurring wants rate stays a
 * flat 30 %, while needs drifts 50 % -> 20 % and savings drifts 20 % -> 50 %.
 */
export const INCREMENT_SPLIT = {
  needs: 0.2,
  wants: 0.3,
  savings: 0.5,
} as const

/**
 * Default one-time split for a bonus / windfall, in PERCENT POINTS (editable per
 * entry). Needs + wants + savings should sum to 100; any shortfall is treated as
 * ordinary spending and simply not deployed.
 */
export const DEFAULT_BONUS_SPLIT = {
  needs: 25,
  wants: 0,
  savings: 75,
} as const

/** Sensible bounds for the assumed annual return, percent. */
export const RETURN_MIN = 0
export const RETURN_MAX = 40
export const DEFAULT_ANNUAL_RETURN_PCT = 12

/** One salary credit. Allocation begins the month AFTER `date` and carries forward. */
export interface SalaryEntry {
  /** Ephemeral React key; stripped from exported JSON, regenerated on load. */
  id: string
  /** ISO "yyyy-mm-dd" credit date. */
  date: string
  /** Monthly in-hand salary in INR (>= 0). */
  amount: number
  /** Optional note, e.g. "Joined ACME" or "FY19 appraisal". */
  note: string
}

/** One bonus / maturity / windfall, deployed as a one-off the month AFTER `date`. */
export interface BonusEntry {
  id: string
  /** ISO "yyyy-mm-dd" receipt date. */
  date: string
  /** One-time amount in INR (>= 0). */
  amount: number
  /** Share sent to needs, percent points (editable). */
  needsPct: number
  /** Share sent to wants, percent points (editable). */
  wantsPct: number
  /** Share sent to savings, percent points (editable). */
  savingsPct: number
  /** Optional note, e.g. "Diwali bonus" or "FD maturity". */
  note: string
}

export interface MnwsSettings {
  /** Assumed annual return on invested savings, percent (e.g. 12). */
  annualReturnPct: number
}

export interface MnwsMeta {
  /** Plan / person label shown in the header and used in the download filename. */
  planName: string
  /** Equals `SCHEMA_VERSION` when the file was written. */
  schemaVersion: number
  /** ISO 8601 timestamp stamped at export time (empty until first export). */
  savedAt: string
}

export interface MnwsDataset {
  meta: MnwsMeta
  salaries: SalaryEntry[]
  bonuses: BonusEntry[]
  settings: MnwsSettings
}
