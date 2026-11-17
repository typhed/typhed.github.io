"use client"

import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/react"
import { PROPERTIES } from "@typhed/brand"
import colors from "@typhed/brand/tokens/colors.json"
import { useTheme } from "next-themes"

import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY } from "./env"

/** Every property origin, so a sign-in can return to whichever site started it. */
const PROPERTY_ORIGINS = Object.values(PROPERTIES).map((property) => property.url)

/**
 * Client-only Clerk provider for the static exports. The apps have no server,
 * so this uses the framework-agnostic `@clerk/react` SDK rather than
 * `@clerk/nextjs`, whose provider imports a Server Action that a static export
 * cannot build.
 *
 * It must sit inside ThemeProvider: the accent of Clerk's modal follows the
 * active theme, read from the brand colour tokens (indigo in light, cyan in
 * dark). Dark is the default theme, so it is also the pre-hydration colour.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()

  if (!CLERK_ENABLED) return <>{children}</>

  const theme = resolvedTheme === "light" ? colors.themes.light : colors.themes.dark

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      allowedRedirectOrigins={PROPERTY_ORIGINS}
      appearance={{ variables: { colorPrimary: `hsl(${theme.vars.brand})` } }}
    >
      {children}
    </ClerkProvider>
  )
}
