"use client"

import type { ReactNode } from "react"
import { useAuth } from "@clerk/react"

import { CLERK_ENABLED } from "./env"

/**
 * Show `children` to a signed-in visitor and `fallback` to everyone else.
 * While Clerk resolves the session it renders `loading`, so the gated content
 * never flashes. With auth off the gate is transparent.
 *
 * This is a client-side gate: the gated content still ships in the page, so it
 * controls access and sign-in, not secrecy. Each property supplies its own
 * fallback (its sign-in prompt) and loading placeholder.
 */
export function SignedInGate({
  children,
  fallback,
  loading = null,
}: {
  children: ReactNode
  fallback: ReactNode
  loading?: ReactNode
}) {
  if (!CLERK_ENABLED) return <>{children}</>
  return (
    <SignedInGateInner fallback={fallback} loading={loading}>
      {children}
    </SignedInGateInner>
  )
}

function SignedInGateInner({
  children,
  fallback,
  loading,
}: {
  children: ReactNode
  fallback: ReactNode
  loading: ReactNode
}) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <>{loading}</>
  return <>{isSignedIn ? children : fallback}</>
}
