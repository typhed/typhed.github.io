"use client"

import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/react"

/**
 * Client-side Clerk provider for the static homepage.
 *
 * The site is a static export (`output: "export"`) with no server runtime, so
 * we use Clerk's framework-agnostic React SDK (`@clerk/react`) instead of
 * `@clerk/nextjs`. The Next adapter's provider statically imports a Server
 * Action, which a static export forbids, and that breaks the build. The React
 * SDK boots Clerk in the browser from the publishable key alone: no Server
 * Actions, no middleware, which is exactly what a server-less homepage needs.
 *
 * The publishable key is public and injected at build time via
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; the build fails fast if it is missing.
 * `appearance.colorPrimary` matches the dark theme's `--brand` token so Clerk's
 * hosted UI blends with the site.
 */
export function ClerkClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
      appearance={{ variables: { colorPrimary: "hsl(188 86% 53%)" } }}
    >
      {children}
    </ClerkProvider>
  )
}
