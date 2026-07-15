"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/react";

import { CLERK_ENABLED } from "@/lib/env";
import { LOGIN_CTA } from "@/lib/constants";
import { Button } from "@/components/ui/button";

/** Header auth slot: user menu when signed in, a modal sign-in CTA otherwise. */
export function AuthButtons() {
  // Guard before the hook: with no key there is no ClerkProvider, and useAuth
  // may only run inside one. CLERK_ENABLED is a build-time constant.
  if (!CLERK_ENABLED) {
    return null;
  }
  return <AuthButtonsInner />;
}

function AuthButtonsInner() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <SignInButton mode="modal">
      <Button variant="brand" size="sm">
        {LOGIN_CTA}
      </Button>
    </SignInButton>
  );
}
