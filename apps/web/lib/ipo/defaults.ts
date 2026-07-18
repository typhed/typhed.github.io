/**
 * Seed dataset and row factories for the IPO dashboard.
 *
 * `DEFAULT_IPO_DATASET` reproduces the source spreadsheet verbatim so the page
 * renders complete, real-looking data on first visit (and after "Reset to
 * sample"). The factories mint fresh row ids for edit-mode add/remove and for
 * rows rebuilt by the JSON parser.
 */

import type {
  Application,
  Contributor,
  FinancialRow,
  GmpRow,
  IpoDataset,
  Milestone,
  SubscriptionRow,
} from "./types";
import { SCHEMA_VERSION } from "./types";
import { newId } from "@/lib/utils";

export function makeMilestone(init: Omit<Milestone, "id">): Milestone {
  return { id: newId(), ...init };
}

export function makeFinancialRow(init: Omit<FinancialRow, "id">): FinancialRow {
  return { id: newId(), ...init };
}

export function makeGmpRow(init: Omit<GmpRow, "id">): GmpRow {
  return { id: newId(), ...init };
}

export function makeContributor(init: Omit<Contributor, "id">): Contributor {
  return { id: newId(), ...init };
}

export function makeApplication(init: Omit<Application, "id">): Application {
  return { id: newId(), ...init };
}

export function makeSubscriptionRow(init: Omit<SubscriptionRow, "id">): SubscriptionRow {
  return { id: newId(), ...init };
}

/** The seed IPO - identical to the source spreadsheet screenshot. */
export function defaultIpoDataset(): IpoDataset {
  return {
    meta: {
      companyName: "SBI Funds Management",
      nseSymbol: "SBIFUNDS",
      applicationType: "MAINBOARD",
      lotSize: 26,
      priceBand: { min: 545, max: 574 },
      currency: "INR",
      unitLabel: "Cr",
      schemaVersion: SCHEMA_VERSION,
      savedAt: "",
    },
    timeline: [
      makeMilestone({ label: "Offer Start", date: "2026-07-14" }),
      makeMilestone({ label: "Offer End", date: "2026-07-16" }),
      makeMilestone({ label: "Allotment Date", date: "2026-07-17" }),
      makeMilestone({ label: "Refund Initiation", date: "2026-07-20" }),
      makeMilestone({ label: "DEMAT Transfer", date: "2026-07-20" }),
      makeMilestone({ label: "Listing Date", date: "2026-07-21" }),
      makeMilestone({ label: "Mandate End", date: "2026-07-31" }),
    ],
    financials: [
      makeFinancialRow({ period: "Mar'24", totalAssets: 7106.93, grossRevenue: 3426.08, pat: 2072.79 }),
      makeFinancialRow({ period: "Mar'25", totalAssets: 8771.86, grossRevenue: 4236.15, pat: 2540.15 }),
      makeFinancialRow({ period: "Mar'26", totalAssets: 6420.45, grossRevenue: 4976.11, pat: 3067.38 }),
    ],
    gmp: [
      makeGmpRow({ date: "2026-07-09", value: 84 }),
      makeGmpRow({ date: "2026-07-10", value: 110 }),
      makeGmpRow({ date: "2026-07-11", value: 88 }),
      makeGmpRow({ date: "2026-07-12", value: 89 }),
      makeGmpRow({ date: "2026-07-13", value: 100 }),
      makeGmpRow({ date: "2026-07-14", value: 88 }),
      makeGmpRow({ date: "2026-07-15", value: 92 }),
      makeGmpRow({ date: "2026-07-16", value: 96 }),
    ],
    // No applications by default - the user creates their own from a blank tracker.
    applications: [],
    subscription: [
      makeSubscriptionRow({ category: "QIB", timesSubscribed: 140.11 }),
      makeSubscriptionRow({ category: "bHNI", timesSubscribed: 26.01 }),
      makeSubscriptionRow({ category: "sHNI", timesSubscribed: 15.51 }),
      makeSubscriptionRow({ category: "RETAIL", timesSubscribed: 3.76 }),
      makeSubscriptionRow({ category: "CUSTOM", label: "EMPLOYEE", timesSubscribed: 4.65 }),
      makeSubscriptionRow({ category: "SHAREHOLDER", timesSubscribed: 9.52 }),
      makeSubscriptionRow({ category: "OVERALL", timesSubscribed: 41.73 }),
    ],
  };
}

/** A ready-made instance for initial React state / SSR (deterministic ids at import). */
export const DEFAULT_IPO_DATASET: IpoDataset = defaultIpoDataset();
