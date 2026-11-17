"use client";

import * as React from "react";
import type { SimulationSummary } from "@typhed/risk-toolkit";

import { fmtMoney } from "@/lib/format";

/** Percentile fan anchored at the start value, with faint spaghetti paths. */
export function FanChart({
  summary,
  anchorLabel = "anchored at",
}: {
  summary: SimulationSummary;
  /** Lead-in for the anchor caption, e.g. "anchored at the last close". */
  anchorLabel?: string;
}) {
  const width = 720;
  const height = 260;
  const { fan, samplePaths, startValue, horizon } = summary;

  const { areas, median, spaghetti, anchorY, minLabel, maxLabel } =
    React.useMemo(() => {
      let min = Infinity;
      let max = -Infinity;
      for (const band of fan) {
        for (const v of band) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      for (const path of samplePaths) {
        for (const v of path) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      if (min === max) {
        min -= 1;
        max += 1;
      }
      const x = (i: number) => (horizon === 0 ? 0 : (i / horizon) * width);
      const y = (v: number) => height - ((v - min) / (max - min)) * height;
      const line = (band: number[]) =>
        band.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      const area = (lower: number[], upper: number[]) => {
        const up = upper
          .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
          .join(" L");
        const down = [...lower]
          .reverse()
          .map((v, i) => {
            const idx = lower.length - 1 - i;
            return `${x(idx).toFixed(1)},${y(v).toFixed(1)}`;
          })
          .join(" L");
        return `M${up} L${down} Z`;
      };

      return {
        areas: [
          { d: area(fan[0]!, fan[4]!), opacity: 0.1 },
          { d: area(fan[1]!, fan[3]!), opacity: 0.2 },
        ],
        median: line(fan[2]!),
        spaghetti: samplePaths.map(line),
        anchorY: y(startValue),
        minLabel: fmtMoney(min, 0),
        maxLabel: fmtMoney(max, 0),
      };
    }, [fan, samplePaths, startValue, horizon]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full rounded-md border border-border bg-background"
        preserveAspectRatio="none"
        role="img"
        aria-label="Percentile fan of simulated paths"
      >
        {areas.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill="hsl(var(--brand))"
            fillOpacity={a.opacity}
          />
        ))}
        {spaghetti.map((points, i) => (
          <polyline
            key={i}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="text-muted-foreground"
          />
        ))}
        <polyline
          points={median}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          x2={width}
          y1={anchorY}
          y2={anchorY}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          P5-P95 shaded, P25-P75 darker, median line - {anchorLabel}{" "}
          {fmtMoney(summary.startValue, 0)}
        </span>
        <span>
          y: {minLabel} to {maxLabel}
        </span>
      </div>
    </div>
  );
}
