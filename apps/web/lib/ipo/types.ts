/**
 * Data model for the static IPO dashboard (`/tools/ipo`).
 *
 * The dataset is the single source of truth: it is what the page renders, what
 * the user edits, and what is written to / read from the downloadable JSON file
 * and browser localStorage. Keep it JSON-serialisable and free of React types.
 */

/** Bumped whenever the on-disk JSON shape changes; drives `safeParseIpoDataset` migration. */
export const SCHEMA_VERSION = 3;

/**
 * The localStorage key holding the last-edited dataset for this browser. Bumped
 * to `v2` alongside SCHEMA_VERSION 3 so a stale `v1` cache does not mask the new
 * seed dataset; the portable JSON file remains importable regardless.
 */
export const IPO_STORAGE_KEY = "typhed:ipo:v2";

/** Whether the issue is on the main board or the SME platform. */
export const APPLICATION_TYPES = ["MAINBOARD", "SME"] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

/** Investor category an application is filed under - drives allotment probability. */
export const APPLICATION_CATEGORIES = ["RETAIL", "sHNI", "bHNI", "SHAREHOLDER"] as const;
export type ApplicationCategory = (typeof APPLICATION_CATEGORIES)[number];

/**
 * Categories the subscription panel may list. The four application categories
 * drive probability; QIB / EMPLOYEE / OVERALL are context-only rows with fixed
 * labels; CUSTOM is a user-added row that carries its own free-text `label`.
 */
export const SUBSCRIPTION_CATEGORIES = [
  "RETAIL",
  "sHNI",
  "bHNI",
  "SHAREHOLDER",
  "QIB",
  "EMPLOYEE",
  "OVERALL",
  "CUSTOM",
] as const;
export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

/**
 * Fixed-label rows seeded by default, in display order. Their names are not
 * editable (only the times value is); user-added CUSTOM rows sit before OVERALL.
 */
export const DEFAULT_SUBSCRIPTION_CATEGORIES: readonly SubscriptionCategory[] = [
  "QIB",
  "bHNI",
  "sHNI",
  "RETAIL",
  "SHAREHOLDER",
  "OVERALL",
];

export interface PriceBand {
  /** Lower price band, INR per share. */
  min: number;
  /** Upper (cut-off) price band, INR per share. */
  max: number;
}

export interface IpoMeta {
  /** Free-text company / issue name shown in the header. */
  companyName: string;
  /** NSE trading symbol / ticker, e.g. "SBIFUNDS" (empty when unknown). */
  nseSymbol: string;
  /** Main board vs SME platform. */
  applicationType: ApplicationType;
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

/** One person who funded part of an application's corpus. */
export interface Contributor {
  id: string;
  name: string;
  /** Shares this person funds (>= 0). */
  units: number;
  /** INR per share they put in (normally the cut-off / issue price). */
  price: number;
}

/** How an allotment outcome is entered. */
export const ALLOTMENT_MODES = ["total", "detailed"] as const;
export type AllotmentMode = (typeof ALLOTMENT_MODES)[number];

/** Outcome recorded once an application is allotted. */
export interface AllotmentResult {
  /**
   * "total" (default): the realised profit is entered as a single amount.
   * "detailed": profit is derived from quantity allotted and selling price.
   */
  mode: AllotmentMode;
  /** Shares actually received (whole lots) - used in "detailed" mode. */
  quantityAllotted: number;
  /** INR per share realised on sale (0 if unsold) - used in "detailed" mode. */
  sellingPrice: number;
  /** Realised profit in INR, entered directly - used in "total" mode. */
  totalAmount: number;
}

/** One IPO application, funded by one or more contributors under a single PAN/name. */
export interface Application {
  id: string;
  /** Identifier - PAN or name recommended, e.g. "Debmalya Pramanik (ZERODHA)". */
  name: string;
  category: ApplicationCategory;
  allotted: boolean;
  allotment: AllotmentResult;
  contributors: Contributor[];
}

/** One category's latest oversubscription reading, "x times". */
export interface SubscriptionRow {
  id: string;
  category: SubscriptionCategory;
  /** Free-text name for a user-added ("CUSTOM") row; ignored for fixed categories. */
  label?: string;
  /** Times subscribed (>= 0), e.g. 5.2. */
  timesSubscribed: number;
}

export interface IpoDataset {
  meta: IpoMeta;
  timeline: Milestone[];
  financials: FinancialRow[];
  gmp: GmpRow[];
  applications: Application[];
  subscription: SubscriptionRow[];
}
