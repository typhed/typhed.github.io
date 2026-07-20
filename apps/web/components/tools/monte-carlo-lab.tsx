"use client";

import * as React from "react";
import { RotateCcw, Square } from "lucide-react";
import type { Candle } from "@typhed/chart-engine";
import {
  logReturns,
  type DataDrivenMode,
  type SimulateInput,
  type SimulationSummary,
} from "@typhed/risk-toolkit";

import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { useSimulation } from "@/lib/use-simulation";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  Segmented,
  StatTile,
  ToolCard,
} from "@/components/tools/controls";

const MODE_OPTIONS: ReadonlyArray<{ value: DataDrivenMode; label: string }> = [
  { value: "iid", label: "IID bootstrap" },
  { value: "block", label: "Block bootstrap" },
  { value: "gbm", label: "GBM (normal)" },
  { value: "studentT", label: "Student-t" },
];

const PATH_TIERS = [
  { value: "1k", label: "1k", paths: 1000 },
  { value: "10k", label: "10k", paths: 10000 },
  { value: "50k", label: "50k", paths: 50000 },
  { value: "100k", label: "100k", paths: 100000 },
] as const;

type PathTier = (typeof PATH_TIERS)[number]["value"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The data-driven Monte Carlo tool (MC v2): simulates forward from the
 * uploaded series' own log returns in four modes, runs everything on the
 * shared worker with debounced inputs and cancellation, and anchors the
 * percentile fan at the last close. Every run is seeded - the "next seed"
 * button is the honest stability check.
 */
export function MonteCarloLab({ candles }: { candles: readonly Candle[] }) {
  const [mode, setMode] = React.useState<DataDrivenMode>("iid");
  const [horizon, setHorizon] = React.useState(252);
  const [tier, setTier] = React.useState<PathTier>("10k");
  const [seed, setSeed] = React.useState(1);
  const [antithetic, setAntithetic] = React.useState(false);
  const [blockOverride, setBlockOverride] = React.useState(0);
  const [ruinPct, setRuinPct] = React.useState(50);
  const [targetGainPct, setTargetGainPct] = React.useState(20);

  const { status, progress, summary, error, run, cancel } = useSimulation();

  const returns = React.useMemo(
    () => logReturns(candles.map((c) => c.close)),
    [candles],
  );
  const lastClose = candles.length
    ? candles[candles.length - 1]!.close
    : 1;

  const parametric = mode === "gbm" || mode === "studentT";

  const input = React.useMemo<SimulateInput>(
    () => ({
      logReturns: returns,
      mode,
      horizon: clamp(Math.round(horizon) || 1, 1, 2520),
      paths: PATH_TIERS.find((t) => t.value === tier)!.paths,
      seed: Math.round(seed),
      antithetic: antithetic && parametric,
      startValue: lastClose,
      ruinFraction: clamp(ruinPct, 1, 99) / 100,
      targetMultiple: 1 + Math.max(0, targetGainPct) / 100,
      samplePaths: 12,
      collectTerminals: true,
      ...(mode === "block" && blockOverride > 0
        ? { blockLength: blockOverride }
        : {}),
    }),
    [
      returns,
      mode,
      horizon,
      tier,
      seed,
      antithetic,
      parametric,
      lastClose,
      ruinPct,
      targetGainPct,
      blockOverride,
    ],
  );

  // Debounced auto-run: keystrokes never freeze anything (the simulation is
  // in the worker), and rapid edits collapse into one run.
  React.useEffect(() => {
    if (returns.length < 2) return;
    const timer = setTimeout(() => run(input), 400);
    return () => clearTimeout(timer);
  }, [input, run, returns.length]);

  if (returns.length < 2) {
    return (
      <ToolCard title="Monte Carlo Lab">
        <p className="text-sm text-muted-foreground">
          Not enough bars to fit the simulation - upload a longer series.
        </p>
      </ToolCard>
    );
  }

  return (
    <ToolCard
      title="Monte Carlo Lab"
      description="Simulate forward from this series' own returns - bootstrap or parametric - and read the odds off the simulated distribution."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
        <Segmented
          options={PATH_TIERS.map(({ value, label }) => ({ value, label }))}
          value={tier}
          onChange={setTier}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <NumberField
          label="Horizon (bars)"
          value={horizon}
          onChange={setHorizon}
          min={1}
          max={2520}
        />
        <NumberField label="Seed" value={seed} onChange={setSeed} min={0} />
        <NumberField
          label="Ruin level"
          value={ruinPct}
          onChange={setRuinPct}
          min={1}
          max={99}
          suffix="% of start"
        />
        <NumberField
          label="Target gain"
          value={targetGainPct}
          onChange={setTargetGainPct}
          min={0}
          suffix="%"
        />
        {mode === "block" && (
          <NumberField
            label="Block length (0 = auto)"
            value={blockOverride}
            onChange={setBlockOverride}
            min={0}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label
          className={`flex items-center gap-2 text-sm ${parametric ? "" : "text-muted-foreground"}`}
          title={
            parametric
              ? "Pairs each innovation path with its negation - cheap variance reduction for smooth statistics like the mean; weaker for tail metrics like max drawdown."
              : "Antithetic pairing applies to the parametric modes (GBM, Student-t) only - resampling has nothing to mirror."
          }
        >
          <input
            type="checkbox"
            checked={antithetic && parametric}
            disabled={!parametric}
            onChange={(e) => setAntithetic(e.target.checked)}
          />
          Antithetic variates
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSeed((s) => Math.round(s) + 1)}
          title="Re-run with the next seed - stable headline numbers across seeds mean the path count is high enough."
        >
          <RotateCcw className="h-4 w-4" />
          Repeat, next seed
        </Button>
        {status === "running" && (
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-40 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-brand transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <Square className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {summary && (
        <LabResults summary={summary} targetGainPct={targetGainPct} />
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Simulation, not prediction: these are the odds your own history
        implies under each model&apos;s assumptions, nothing more. IID and
        block bootstraps resample the uploaded returns (block preserves
        short-range dependence; the block length defaults to the
        Patton-Politis-White automatic estimate). GBM and Student-t fit the
        sample moments; the t degrees of freedom are moment-matched to the
        sample kurtosis and capped at 50. All runs execute in a background
        worker; the same seed with the same inputs always reproduces the
        same numbers. Not investment advice.
      </p>
    </ToolCard>
  );
}

function LabResults({
  summary,
  targetGainPct,
}: {
  summary: SimulationSummary;
  targetGainPct: number;
}) {
  const modeFacts: string[] = [
    `drift/bar ${fmtPercent(Math.expm1(summary.drift), 3)}`,
    `sigma/bar ${fmtPercent(summary.sigma, 3)}`,
  ];
  if (summary.blockLength !== null) {
    modeFacts.push(`block length ${fmtNumber(summary.blockLength, 1)}`);
  }
  if (summary.nu !== null) {
    modeFacts.push(`t degrees of freedom ${summary.nu}`);
  }
  if (summary.antithetic) modeFacts.push("antithetic on");

  return (
    <>
      <div className="mt-6">
        <FanChart summary={summary} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {summary.paths.toLocaleString("en-IN")} paths, seed {summary.seed} -{" "}
        {modeFacts.join(", ")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Median terminal"
          value={fmtMoney(summary.terminal.p50, 0)}
          tone="brand"
        />
        <StatTile
          label="5th percentile"
          value={fmtMoney(summary.terminal.p05, 0)}
          tone="negative"
        />
        <StatTile
          label="95th percentile"
          value={fmtMoney(summary.terminal.p95, 0)}
          tone="positive"
        />
        <StatTile
          label="P(loss)"
          value={fmtPercent(summary.terminal.probLoss)}
          note="ends below start"
        />
        <StatTile
          label={`P(+${fmtNumber(targetGainPct, 0)}%)`}
          value={
            summary.terminal.probTarget === null
              ? "-"
              : fmtPercent(summary.terminal.probTarget)
          }
          note="reaches target"
        />
        <StatTile
          label="Horizon VaR 95%"
          value={fmtPercent(summary.horizonVar95)}
          tone="negative"
          note="from simulated terminals"
        />
        <StatTile
          label="Horizon CVaR 95%"
          value={fmtPercent(summary.horizonCvar95)}
          tone="negative"
          note="mean tail loss"
        />
        <StatTile
          label="Risk of ruin"
          value={fmtPercent(summary.ruinProbability)}
          tone={summary.ruinProbability > 0.1 ? "negative" : "positive"}
        />
        <StatTile
          label="Median max DD"
          value={fmtPercent(summary.maxDrawdown.median)}
        />
        <StatTile
          label="P95 max DD"
          value={fmtPercent(summary.maxDrawdown.p95)}
          tone="negative"
          note={`worst ${fmtPercent(summary.maxDrawdown.worst)}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Distribution
          title="Terminal wealth distribution"
          values={summary.terminals!}
          format={(v) => fmtMoney(v, 0)}
        />
        <Distribution
          title="Max drawdown distribution"
          values={summary.maxDrawdowns!}
          format={(v) => fmtPercent(v, 0)}
        />
      </div>
    </>
  );
}

/** Percentile fan anchored at the last close, with faint spaghetti paths. */
function FanChart({ summary }: { summary: SimulationSummary }) {
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
        aria-label="Percentile fan of simulated price paths anchored at the last close"
      >
        {areas.map((a, i) => (
          <path key={i} d={a.d} fill="hsl(var(--brand))" fillOpacity={a.opacity} />
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
          P5-P95 shaded, P25-P75 darker, median line - anchored at{" "}
          {fmtMoney(summary.startValue, 0)}
        </span>
        <span>
          y: {minLabel} to {maxLabel}
        </span>
      </div>
    </div>
  );
}

/** A small SVG histogram of a per-path metric. */
function Distribution({
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
