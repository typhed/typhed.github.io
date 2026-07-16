"use client";

import { useUser } from "@clerk/react";

import { CLERK_ENABLED } from "@/lib/env";

export type FeatureId =
  | "chart"
  | "indicators"
  | "sizer"
  | "risk-basic"
  | "montecarlo"
  | "advanced"
  | "risk-parity";

export type Tier = "free" | "pro";

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
  granted: string[];
  has: (feature: FeatureId) => boolean;
}

function grantsFor(tier: Tier, granted: string[]) {
  return (feature: FeatureId): boolean => {
    if (FEATURES[feature].tier === "free") return true;
    if (tier === "pro") return true;
    return granted.includes(feature);
  };
}

/**
 * Per-user entitlements, read from Clerk `publicMetadata`. `publicMetadata` is
 * readable in the browser but only writable server-side (the Clerk Dashboard or
 * backend API), so a user cannot grant themselves a paid feature.
 *
 * When Clerk is disabled (no key) the app treats everyone as a free user, so
 * paid features render their locked state - useful for local development.
 *
 * Note: this is a soft gate. A paid tool's code still ships in the bundle;
 * genuine IP protection needs the Phase 5 serverless verification.
 */
export function useEntitlements(): Entitlements {
  // CLERK_ENABLED is a build-time constant, so this branch is stable for the
  // whole build and the hook order never changes at runtime.
  if (!CLERK_ENABLED) {
    return {
      isLoaded: true,
      tier: "free",
      granted: [],
      has: grantsFor("free", []),
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isLoaded, user } = useUser();
  const metadata = (user?.publicMetadata ?? {}) as {
    tier?: Tier;
    entitlements?: string[];
  };
  const tier: Tier = metadata.tier === "pro" ? "pro" : "free";
  const granted = Array.isArray(metadata.entitlements) ? metadata.entitlements : [];

  return { isLoaded, tier, granted, has: grantsFor(tier, granted) };
}
