"use client"

import type { Timeframe } from "@typhed/chart-engine"

import { cn } from "@typhed/ui/lib/utils"

/** Row of timeframe buttons, TradingView style. */
export function TimeframeSelect({
  options,
  value,
  onChange,
}: {
  options: readonly Timeframe[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="border-border bg-card flex flex-wrap items-center gap-1 rounded-md border p-1">
      {options.map((tf) => (
        <button
          key={tf.id}
          type="button"
          aria-pressed={tf.id === value}
          onClick={() => onChange(tf.id)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            tf.id === value
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {tf.id}
        </button>
      ))}
    </div>
  )
}
