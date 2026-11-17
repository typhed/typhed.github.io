"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "../lib/utils"

/**
 * Light/dark switch styled as a sliding toggle: the track carries a sun and
 * a moon, and the knob slides to the active side. Until mounted it renders
 * in the light/sun position so the server markup matches the first client
 * render (the resolved theme is only known in the browser), then settles to
 * the real theme — this avoids a hydration mismatch.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="border-border bg-secondary ring-offset-background hover:border-brand/50 focus-visible:ring-ring relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Sun
        className="text-muted-foreground pointer-events-none absolute left-1.5 h-3.5 w-3.5"
        aria-hidden="true"
      />
      <Moon
        className="text-muted-foreground pointer-events-none absolute right-1.5 h-3.5 w-3.5"
        aria-hidden="true"
      />
      <span
        className={cn(
          "bg-primary text-primary-foreground pointer-events-none relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-200",
          isDark ? "translate-x-6" : "translate-x-0",
        )}
      >
        {mounted ? (
          isDark ? (
            <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : null}
      </span>
    </button>
  )
}
