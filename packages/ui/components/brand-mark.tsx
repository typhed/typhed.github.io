import * as React from "react"

import { SITE } from "../lib/constants"
import { cn } from "../lib/utils"

type BrandMarkProps = {
  /** Render the "TyPhed" wordmark next to the glyph. */
  showWordmark?: boolean
  className?: string
  glyphClassName?: string
}

/**
 * The TyPhed identity: a geometric glyph (an upward node forming a "T",
 * evoking engineering and forward motion) paired with the wordmark.
 * The glyph fills with the brand gradient; the wordmark uses the display
 * font set in the app theme.
 */
export function BrandMark({
  showWordmark = true,
  className,
  glyphClassName,
}: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 48 48"
        role="img"
        aria-label={`${SITE.name} logo`}
        className={cn("h-9 w-9", glyphClassName)}
      >
        <defs>
          <linearGradient id="typhed-brand-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" />
            <stop offset="100%" stopColor="hsl(var(--brand-2))" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="none"
          stroke="url(#typhed-brand-gradient)"
          strokeWidth="2.5"
          opacity="0.55"
        />
        <path
          d="M14 17 H34"
          stroke="url(#typhed-brand-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M24 17 V33"
          stroke="url(#typhed-brand-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="33" r="3.4" fill="url(#typhed-brand-gradient)" />
        <circle cx="14" cy="17" r="2.6" fill="url(#typhed-brand-gradient)" />
        <circle cx="34" cy="17" r="2.6" fill="url(#typhed-brand-gradient)" />
      </svg>
      {showWordmark ? (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Ty<span className="text-brand">Phed</span>
        </span>
      ) : null}
    </span>
  )
}
