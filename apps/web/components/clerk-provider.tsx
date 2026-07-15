"use client";

import * as React from "react";
import { ClerkProvider } from "@clerk/react";

import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY } from "@/lib/env";

/**
 * Mounts Clerk in client-only (SPA) mode so the app stays statically
 * exportable - no middleware, no server. When no key is configured the app
 * renders without a provider and auth is treated as OFF everywhere.
 *
 * Session sharing across every *.typhed.com subdomain is automatic because
 * this site reuses the parent Clerk application; no satellite-domain setup.
 */
export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  if (!CLERK_ENABLED) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary: "#6366f1" } }}
    >
      {children}
    </ClerkProvider>
  );
}
