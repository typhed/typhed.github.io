"use client";

import { useEntitlements as useAccountEntitlements, type Tier } from "@typhed/auth";

export type FeatureId =
  | "chart"
  | "indicators"
  | "sizer"
  | "risk-basic"
  | "montecarlo"
  | "advanced"
  | "risk-parity";

export type { Tier };

export interface FeatureMeta {
  id: FeatureId;
  label: string;
  tier: Tier;
}

/**
 * The catalogue of gated features. `tier: "free"` is always available; `"pro"`
 * requires an entitlement. The free/paid split is a data decision - flip a
 * tier here (and grant the slug in Clerk) with no code change to the tools.
 */
export const FEATURES: Record<FeatureId, FeatureMeta> = {
  chart: { id: "chart", label: "Charting", tier: "free" },
  indicators: { id: "indicators", label: "Indicators", tier: "free" },
  sizer: { id: "sizer", label: "Position sizer", tier: "free" },
  "risk-basic": { id: "risk-basic", label: "Risk summary", tier: "free" },
  montecarlo: { id: "montecarlo", label: "Monte Carlo", tier: "pro" },
  advanced: { id: "advanced", label: "Advanced analytics", tier: "pro" },
  "risk-parity": { id: "risk-parity", label: "Risk parity", tier: "pro" },
};

export interface Entitlements {
  isLoaded: boolean;
  tier: Tier;
  /** The pro feature slugs granted to this user. */
  granted: readonly string[];
  has: (feature: FeatureId) => boolean;
}

function grantsFor(tier: Tier, granted: readonly string[]) {
  return (feature: FeatureId): boolean => {
    if (FEATURES[feature].tier === "free") return true;
    if (tier === "pro") return true;
    return granted.includes(feature);
  };
}

/**
 * Per-user entitlements: the account's tier and grants from the shared
 * @typhed/auth hook (Clerk `publicMetadata`), resolved against this site's
 * feature catalogue. With auth off everyone is a free user, so paid features
 * render their locked state - useful for local development.
 *
 * Note: this is a soft gate. A paid tool's code still ships in the bundle.
 * The hard gate (packages/entitlement-gate) is implemented but not deployed,
 * so until it is, Pro is a convenience tier - never describe it as
 * hard-protected.
 */
export function useEntitlements(): Entitlements {
  const { isLoaded, tier, granted } = useAccountEntitlements()
  return { isLoaded, tier, granted, has: grantsFor(tier, granted) }
}
