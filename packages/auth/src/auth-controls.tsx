"use client"

import { SignInButton, UserButton, useAuth } from "@clerk/react"
import { LOGIN_CTA } from "@typhed/brand"
import { Button } from "@typhed/ui/components/ui/button"

import { CLERK_ENABLED } from "./env"

/**
 * The header's auth control, passed to SiteHeader through its `authSlot` and
 * `mobileAuthSlot`. Signed out, it renders the brand Login / Sign Up button,
 * which opens Clerk's sign-in in a modal so the visitor stays on the page;
 * signed in, Clerk's user menu. Nothing renders until Clerk resolves the
 * session, so the wrong control never flashes, and nothing renders at all
 * when auth is off.
 */
export function AuthControls({ className }: { className?: string }) {
  if (!CLERK_ENABLED) return null
  return <AuthControlsInner className={className} />
}

function AuthControlsInner({ className }: { className?: string }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null
  if (isSignedIn) return <UserButton />

  return (
    <SignInButton mode="modal">
      <Button variant="default" size="sm" className={className}>
        {LOGIN_CTA.label}
      </Button>
    </SignInButton>
  )
}
