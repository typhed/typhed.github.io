import { cn } from "@/lib/utils";
import { SERIES, SERIES_ORDER, type SeriesKey } from "./series";

/**
 * A 100 %-stacked horizontal bar of the three buckets. Accepts raw shares in
 * any units (fractions or percent points) - they are normalised by their sum -
 * so it renders a salary split, a rate split, or a bonus split identically.
 */
export function SplitBar({
  split,
  height = 10,
  className,
}: {
  split: Record<SeriesKey, number>;
  height?: number;
  className?: string;
}) {
  const total =
    SERIES_ORDER.reduce((sum, key) => sum + Math.max(0, split[key]), 0) || 1;
  return (
    <div
      className={cn(
        "bg-muted flex w-full overflow-hidden rounded-full",
        className,
      )}
      style={{ height }}
      role="img"
      aria-label={SERIES_ORDER.map(
        (key) =>
          `${SERIES[key].label} ${Math.round((Math.max(0, split[key]) / total) * 100)}%`,
      ).join(", ")}
    >
      {SERIES_ORDER.map((key) => {
        const pct = (Math.max(0, split[key]) / total) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={key}
            style={{ width: `${pct}%`, backgroundColor: SERIES[key].color }}
          />
        );
      })}
    </div>
  );
}

/** A small legend of the three buckets, each with an optional value. */
export function SeriesLegend({
  values,
  className,
}: {
  values?: Partial<Record<SeriesKey, string>>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs", className)}>
      {SERIES_ORDER.map((key) => (
        <span
          key={key}
          className="text-muted-foreground inline-flex items-center gap-1.5"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: SERIES[key].color }}
          />
          {SERIES[key].label}
          {values?.[key] && (
            <span className="text-foreground font-medium tabular-nums">
              {values[key]}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
