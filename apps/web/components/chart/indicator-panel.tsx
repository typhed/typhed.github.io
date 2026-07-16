"use client";

import {
  INDICATORS,
  type IndicatorId,
  type IndicatorState,
} from "@/lib/indicators";
import { cn } from "@/lib/utils";

/** Toggle row for showing / hiding indicators. */
export function IndicatorPanel({
  state,
  onToggle,
}: {
  state: IndicatorState;
  onToggle: (id: IndicatorId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        Indicators
      </span>
      {INDICATORS.map((indicator) => (
        <button
          key={indicator.id}
          type="button"
          title={indicator.detail}
          aria-pressed={state[indicator.id]}
          onClick={() => onToggle(indicator.id)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            state[indicator.id]
              ? "border-brand bg-brand/10 text-brand"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {indicator.label}
        </button>
      ))}
    </div>
  );
}
