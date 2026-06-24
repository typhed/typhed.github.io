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
      variant="outline"
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="border-border/60 bg-background/40 backdrop-blur-md transition-transform hover:scale-105 hover:bg-accent/60"
    >
      {mounted ? (
        isDark ? (
          <Sun className="text-brand" />
        ) : (
          <Moon className="text-brand-2" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  )
}
