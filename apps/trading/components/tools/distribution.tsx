"use client";

import * as React from "react";

/** A small SVG histogram of a per-path / per-trade metric. */
export function Distribution({
  title,
  values,
  format,
  bins = 40,
}: {
  title: string;
  values: ArrayLike<number>;
  format: (value: number) => string;
  bins?: number;
}) {
  const width = 360;
  const height = 140;

  const { bars, minLabel, maxLabel } = React.useMemo(() => {
    const n = values.length;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < n; i += 1) {
      const v = values[i]!;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!Number.isFinite(min) || min === max) {
      min -= 1;
      max += 1;
    }
    const counts = new Array<number>(bins).fill(0);
    const scale = bins / (max - min);
    for (let i = 0; i < n; i += 1) {
      const bin = Math.min(bins - 1, Math.floor((values[i]! - min) * scale));
      counts[bin] = (counts[bin] ?? 0) + 1;
    }
    const peak = Math.max(...counts, 1);
    const barWidth = width / bins;
    return {
      bars: counts.map((count, i) => ({
        x: i * barWidth,
        h: (count / peak) * (height - 4),
        w: barWidth - 1,
      })),
      minLabel: format(min),
      maxLabel: format(max),
    };
  }, [values, bins, format]);

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full rounded-md border border-border bg-background"
        preserveAspectRatio="none"
        role="img"
        aria-label={title}
      >
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={height - bar.h}
            width={bar.w}
            height={bar.h}
            fill="hsl(var(--brand))"
            fillOpacity={0.6}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
