"use client";

import * as React from "react";
import { ClerkProvider } from "@clerk/react";
import { useTheme } from "next-themes";

import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY } from "@/lib/env";

// The two --brand token values from globals.css, as concrete colours Clerk can
// derive its palette from (its appearance engine needs a parseable colour, not
// a var() reference). Light = indigo, dark = cyan.
const BRAND_LIGHT = "#6366f1";
const BRAND_DARK = "#22d3ee";

/**
 * Mounts Clerk in client-only (SPA) mode so the app stays statically
 * exportable - no middleware, no server. When no key is configured the app
 * renders without a provider and auth is treated as OFF everywhere.
 *
 * Must sit INSIDE ThemeProvider: the modal accent follows the active theme
 * (the previous hard-coded light indigo looked wrong in the cyan dark theme).
 *
 * Session sharing across every *.typhed.com subdomain is automatic because
 * this site reuses the parent Clerk application; no satellite-domain setup.
 */
export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  // The default theme is dark, so dark is also the pre-hydration fallback.
  const { resolvedTheme } = useTheme();
  const colorPrimary = resolvedTheme === "light" ? BRAND_LIGHT : BRAND_DARK;

  if (!CLERK_ENABLED) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary } }}
    >
      {children}
    </ClerkProvider>
  );
}
