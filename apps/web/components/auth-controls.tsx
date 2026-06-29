"use client"

import { Show, SignInButton, UserButton } from "@clerk/react"

import { Button } from "@typhed/ui/components/ui/button"
import { LOGIN_CTA } from "@typhed/ui/lib/constants"

/**
 * The Clerk-backed auth control for the header. Signed out, it renders the
 * shared "Login / Sign Up" Button which opens Clerk's sign-in flow in a modal;
 * signed in, it swaps to Clerk's `UserButton` avatar menu.
 *
 * This lives in `apps/web` (not the shared `@typhed/ui` package) so the UI
 * library stays free of any auth coupling: the header takes the control as a
 * slot. The whole flow is client-side via `@clerk/react` (no middleware and no
 * server call) because the site is a static export with no runtime (see
 * `apps/web/components/clerk-provider.tsx`).
 */
export function AuthControls({ className }: { className?: string }) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="default" size="sm" className={className}>
            {LOGIN_CTA.label}
          </Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  )
}
