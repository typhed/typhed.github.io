"use client"

import * as React from "react"
import { CLERK_ENABLED, useAuth } from "@typhed/auth"
import { clearAllLocalData } from "@/lib/privacy"

/**
 * Shared-device protection: the moment a signed-in user signs out, every
 * locally stored dataset (IPO edits, budgeting plans, saved analyses) is
 * erased. Renders nothing; it only watches the auth transition. Sign-out
 * performed while this site is closed cannot be observed - that boundary
 * is documented in the README.
 */
export function PrivacyGuard() {
  // Build-time constant: with no Clerk key there is no provider to read.
  if (!CLERK_ENABLED) {
    return null
  }
  return <PrivacyGuardInner />
}

function PrivacyGuardInner() {
  const { isLoaded, isSignedIn } = useAuth()
  const wasSignedIn = React.useRef(false)

  React.useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      wasSignedIn.current = true
      return
    }
    if (wasSignedIn.current) {
      wasSignedIn.current = false
      void clearAllLocalData()
    }
  }, [isLoaded, isSignedIn])

  return null
}
