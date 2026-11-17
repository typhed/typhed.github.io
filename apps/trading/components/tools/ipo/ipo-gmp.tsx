"use client";

import * as React from "react";

import { fmtDayMonth, fmtDisplayDate, fmtInr } from "@/lib/format";
import type { GmpRow } from "@/lib/ipo/types";
import { niceScale, sortedGmp, valueRange, type GmpForecast, type GmpStats } from "@/lib/ipo/analytics";
import { useElementWidth } from "@/lib/use-element-width";
import { ChartEmptyState, StatTile, ToolCard } from "@/components/tools/controls";

/** Signed INR delta, e.g. "+₹12" / "-₹4" / "-" when not finite. */
function fmtDelta(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${fmtInr(value, 0)}`;
}

/** Tone for a signed delta: green when up, red when down. */
function deltaTone(value: number): "positive" | "negative" | "default" {
  if (!Number.isFinite(value) || value === 0) return "default";
  return value > 0 ? "positive" : "negative";
}

const HEIGHT = 300;
// Right padding leaves a gutter for the latest-GMP value label at the line end.
const PAD = { top: 16, right: 46, bottom: 28, left: 52 };

export function IpoGmp({
  rows,
  stats,
  forecast,
  listingDate,
  currencyLabel = "₹",
  className,
}: {
  rows: GmpRow[];
  stats: GmpStats;
  forecast: GmpForecast;
  listingDate?: string | null;
  currencyLabel?: string;
  className?: string;
}) {
  const sorted = React.useMemo(() => sortedGmp(rows), [rows]);

  const predictedNote = forecast.ok
    ? `Simple linear regression of GMP${listingDate ? ` to ${fmtDisplayDate(listingDate)}` : ""} · projected GMP ${fmtInr(forecast.predictedGmp, 0)}`
    : "Needs at least two GMP readings";

  return (
    <ToolCard
      title="Reported GMP"
      description="Daily grey-market premium in the run-up to listing."
      className={className}
    >
      <GmpChart rows={sorted} currencyLabel={currencyLabel} />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Latest GMP" value={fmtInr(stats.latest, 0)} tone="brand" />
        <StatTile label="High" value={fmtInr(stats.max, 0)} tone="positive" />
        <StatTile label="Low" value={fmtInr(stats.min, 0)} tone="negative" />

        <StatTile label="Average" value={fmtInr(stats.avg, 0)} />
        <StatTile
          label="Δ First Date"
          value={fmtDelta(stats.trend)}
          tone={deltaTone(stats.trend)}
          note="since first reading"
        />
        <StatTile
          label="Δ Previous Date"
          value={fmtDelta(stats.deltaPrev)}
          tone={deltaTone(stats.deltaPrev)}
          note="since previous reading"
        />

        <div className="sm:col-span-3">
          <StatTile
            label="Predicted Expected Listing"
            value={forecast.ok ? fmtInr(forecast.predictedListingPrice, 0) : "-"}
            tone="brand"
            note={predictedNote}
          />
        </div>
      </div>
    </ToolCard>
  );
}

/** The inline-SVG area+line chart. Rendered at true pixel width for crisp text. */
function GmpChart({ rows, currencyLabel }: { rows: GmpRow[]; currencyLabel: string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);

  const n = rows.length;
  const scale = React.useMemo(() => {
    const { min, max } = valueRange(rows.map((r) => r.value));
    return niceScale(min, max, { maxTicks: 4 });
  }, [rows]);

  if (n === 0) {
    return <ChartEmptyState message="No GMP readings yet." />;
  }

  const iw = Math.max(0, width - PAD.left - PAD.right);
  const ih = HEIGHT - PAD.top - PAD.bottom;
  const span = scale.hi - scale.lo || 1;
  const x = (i: number) => PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => PAD.top + (1 - (v - scale.lo) / span) * ih;

  const linePoints = rows.map((r, i) => `${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
  const areaPoints = `${x(0).toFixed(1)},${(PAD.top + ih).toFixed(1)} ${linePoints} ${x(n - 1).toFixed(1)},${(PAD.top + ih).toFixed(1)}`;
  const lastIdx = n - 1;
  const showMarkers = n <= 24;

  const labelStep = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(width / 72))));
  const showXLabel = (i: number) => i === 0 || i === lastIdx || i % labelStep === 0;

  const moveHover = (e: React.PointerEvent<SVGSVGElement>) => {
    if (n <= 1) return setHover(0);
    // Measure from the SVG itself - nativeEvent.offsetX is relative to whatever
    // child (marker/label) the pointer is over, which would misplace the crosshair.
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const ratio = (localX - PAD.left) / (iw || 1);
    setHover(Math.max(0, Math.min(lastIdx, Math.round(ratio * (n - 1)))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((prev) => {
        const base = prev ?? lastIdx;
        const next = e.key === "ArrowRight" ? base + 1 : base - 1;
        return Math.max(0, Math.min(lastIdx, next));
      });
    } else if (e.key === "Escape") {
      setHover(null);
    }
  };

  const hovered = hover !== null ? rows[hover] : undefined;

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          tabIndex={0}
          aria-label={`Reported GMP from ${currencyLabel}${rows[0]!.value} on ${fmtDisplayDate(rows[0]!.date)} to ${currencyLabel}${rows[lastIdx]!.value} on ${fmtDisplayDate(rows[lastIdx]!.date)}.`}
          className="touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onPointerMove={moveHover}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKeyDown}
          onFocus={() => setHover((prev) => prev ?? lastIdx)}
          onBlur={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ipo-gmp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
            </linearGradient>
          </defs>

          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                className="text-border"
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                fill="currentColor"
                className="fill-current text-[11px] tabular-nums text-muted-foreground"
              >
                {currencyLabel}
                {tick}
              </text>
            </g>
          ))}

          {rows.map((row, i) =>
            showXLabel(i) ? (
              <text
                key={row.id}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fill="currentColor"
                className="text-[11px] text-muted-foreground"
              >
                {fmtDayMonth(row.date)}
              </text>
            ) : null,
          )}

          <polygon points={areaPoints} fill="url(#ipo-gmp-fill)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hover !== null && hovered && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + ih}
              stroke="currentColor"
              className="text-muted-foreground"
              strokeOpacity={0.4}
            />
          )}

          {showMarkers &&
            rows.map((row, i) => (
              <circle
                key={row.id}
                cx={x(i)}
                cy={y(row.value)}
                r={i === lastIdx ? 5 : 3.5}
                fill="hsl(var(--brand))"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))}

          <text
            x={x(lastIdx) + 9}
            y={y(rows[lastIdx]!.value)}
            dy="0.32em"
            textAnchor="start"
            fill="currentColor"
            className="text-[13px] font-semibold tabular-nums text-foreground"
          >
            {currencyLabel}
            {rows[lastIdx]!.value}
          </text>
        </svg>
      )}

      {hover !== null && hovered && width > 0 && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md"
          style={{ left: x(hover), top: Math.max(0, y(hovered.value) - 46) }}
        >
          <div className="font-semibold tabular-nums text-popover-foreground">
            {currencyLabel}
            {hovered.value}
          </div>
          <div className="text-muted-foreground">{fmtDisplayDate(hovered.date)}</div>
        </div>
      )}
    </div>
  );
}
