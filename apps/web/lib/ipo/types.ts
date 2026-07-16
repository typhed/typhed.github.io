/**
 * Data model for the static IPO dashboard (`/tools/ipo`).
 *
 * The dataset is the single source of truth: it is what the page renders, what
 * the user edits, and what is written to / read from the downloadable JSON file
 * and browser localStorage. Keep it JSON-serialisable and free of React types.
 */

/** Bumped whenever the on-disk JSON shape changes; drives `safeParseIpoDataset` migration. */
export const SCHEMA_VERSION = 1;

/** The localStorage key holding the last-edited dataset for this browser. */
export const IPO_STORAGE_KEY = "typhed:ipo:v1";

export interface PriceBand {
  /** Lower price band, INR per share. */
  min: number;
  /** Upper (cut-off) price band, INR per share. */
  max: number;
}

export interface IpoMeta {
  /** Free-text company / issue name shown in the header. */
  companyName: string;
  /** Shares per lot (integer >= 1). */
  lotSize: number;
  priceBand: PriceBand;
  /** ISO 4217 code; display uses `en-IN` regardless, this is metadata. */
  currency: string;
  /** Unit the financial figures are reported in, e.g. "Cr" or "Lakh". */
  unitLabel: string;
  /** Equals `SCHEMA_VERSION` when the file was written. */
  schemaVersion: number;
  /** ISO 8601 timestamp stamped at export time (empty until first export). */
  savedAt: string;
}

/** A dated event in the IPO lifecycle (Offer Start, Listing Date, ...). */
export interface Milestone {
  /** Ephemeral React key; stripped from exported JSON, regenerated on load. */
  id: string;
  label: string;
  /** ISO date, "yyyy-mm-dd". */
  date: string;
}

/** One fiscal year of reported financials. */
export interface FinancialRow {
  id: string;
  /** Period label as shown, e.g. "Mar'26". */
  period: string;
  totalAssets: number;
  grossRevenue: number;
  pat: number;
}

/** One daily grey-market-premium reading. */
export interface GmpRow {
  id: string;
  /** ISO date, "yyyy-mm-dd". */
  date: string;
  /** GMP in INR per share. */
  value: number;
}

export interface IpoDataset {
  meta: IpoMeta;
  timeline: Milestone[];
  financials: FinancialRow[];
  gmp: GmpRow[];
}
