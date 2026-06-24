"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "./ui/button"

/**
 * Light/dark switch. Renders a neutral placeholder until mounted so the
 * server-rendered markup matches the client and avoids hydration warnings
 * (the resolved theme is only known in the browser).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="default"
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="border border-brand/40 bg-primary text-primary-foreground shadow-lg shadow-brand/30 transition-transform hover:scale-110 hover:bg-primary/90"
    >
      {mounted ? (
        isDark ? (
          <Sun />
        ) : (
          <Moon />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  )
}
