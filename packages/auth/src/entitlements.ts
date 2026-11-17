"use client"

import { useUser } from "@clerk/react"

import { CLERK_ENABLED } from "./env"

export type Tier = "free" | "pro"

export interface Entitlements {
  isLoaded: boolean
  tier: Tier
  /** The paid feature slugs granted to this user individually. */
  granted: readonly string[]
}

/**
 * The signed-in user's tier and individual grants, read from Clerk
 * `publicMetadata` (`{ tier, entitlements }`). publicMetadata is readable in the
 * browser but writable only from the Clerk Dashboard or backend API, so a user
 * cannot grant themselves a paid feature. Which features are paid is each
 * property's own catalogue; this hook only reports what the account holds.
 *
 * With auth off, everyone is a free user with no grants.
 */
export function useEntitlements(): Entitlements {
  // CLERK_ENABLED is a build-time constant, so the hook order never changes.
  if (!CLERK_ENABLED) return { isLoaded: true, tier: "free", granted: [] }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isLoaded, user } = useUser()
  const metadata = (user?.publicMetadata ?? {}) as { tier?: Tier; entitlements?: string[] }

  return {
    isLoaded,
    tier: metadata.tier === "pro" ? "pro" : "free",
    granted: Array.isArray(metadata.entitlements) ? metadata.entitlements : [],
  }
}
