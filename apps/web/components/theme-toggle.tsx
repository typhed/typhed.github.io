"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/**
 * The canonical platform theme switch: sun and moon sit on the track and the
 * knob slides over the active side. Semantic switch (`role="switch"`,
 * `aria-checked`); renders the light position until mounted so the server
 * and first client paint always match.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-secondary transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Sun
        aria-hidden="true"
        className="absolute left-1.5 h-4 w-4 text-muted-foreground"
      />
      <Moon
        aria-hidden="true"
        className="absolute right-1.5 h-4 w-4 text-muted-foreground"
      />
      <span
        className={cn(
          "relative z-10 ml-1 h-6 w-6 rounded-full bg-primary shadow transition-transform duration-200",
          isDark ? "translate-x-6" : "translate-x-0",
        )}
      />
    </button>
  );
}
