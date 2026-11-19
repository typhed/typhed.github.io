"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * The brand's theme provider: next-themes with the settings every property
 * shares, written once. The theme is the `.dark` class on `<html>`, which the
 * colour tokens key on; dark is the default; the "system" theme is allowed; and
 * no transition plays during a switch. A caller can still override any prop.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
