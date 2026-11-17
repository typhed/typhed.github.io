"use client";

import * as React from "react";
import { monteCarloDrawdown } from "@typhed/risk-toolkit";

import { fmtMoney, fmtPercent } from "@/lib/format";
import { NumberField, StatTile, ToolCard } from "@/components/tools/controls";

export function MonteCarlo() {
  const [startEquity, setStartEquity] = React.useState(100000);
  const [winRatePct, setWinRatePct] = React.useState(55);
  const [winReturnPct, setWinReturnPct] = React.useState(2);
  const [lossReturnPct, setLossReturnPct] = React.useState(-1);
  const [tradesPerTrial, setTradesPerTrial] = React.useState(200);
  const [trials, setTrials] = React.useState(2000);
  const [ruinPct, setRuinPct] = React.useState(50);
  const [seed, setSeed] = React.useState(1);

  const result = React.useMemo(
    () =>
      monteCarloDrawdown({
        startEquity,
        trials: Math.max(1, Math.min(20000, Math.round(trials))),
        tradesPerTrial: Math.max(1, Math.min(2000, Math.round(tradesPerTrial))),
        winRate: winRatePct / 100,
        winReturn: winReturnPct / 100,
        lossReturn: lossReturnPct / 100,
        ruinFraction: ruinPct / 100,
        seed: Math.round(seed),
        samplePaths: 12,
      }),
    [startEquity, trials, tradesPerTrial, winRatePct, winReturnPct, lossReturnPct, ruinPct, seed],
  );

  const ruinTone = result.ruinProbability > 0.1 ? "negative" : "positive";

  return (
    <ToolCard
      title="Monte Carlo drawdown & risk of ruin"
      description="Simulate many possible equity paths under a fixed win rate and per-trade return, and see how deep the drawdowns get."
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <NumberField label="Start equity" value={startEquity} onChange={setStartEquity} min={0} />
        <NumberField label="Win rate" value={winRatePct} onChange={setWinRatePct} min={0} max={100} suffix="%" />
        <NumberField label="Win return" value={winReturnPct} onChange={setWinReturnPct} suffix="%" />
        <NumberField label="Loss return" value={lossReturnPct} onChange={setLossReturnPct} suffix="%" />
        <NumberField label="Trades / path" value={tradesPerTrial} onChange={setTradesPerTrial} min={1} />
        <NumberField label="Paths" value={trials} onChange={setTrials} min={1} />
        <NumberField label="Ruin level" value={ruinPct} onChange={setRuinPct} min={0} max={100} suffix="%" />
        <NumberField label="Seed" value={seed} onChange={setSeed} min={0} />
      </div>

      <div className="mt-6">
        <EquityFan paths={result.paths} startEquity={startEquity} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Median final" value={fmtMoney(result.finalEquity.p50, 0)} tone="brand" />
        <StatTile label="5th percentile" value={fmtMoney(result.finalEquity.p05, 0)} tone="negative" />
        <StatTile label="95th percentile" value={fmtMoney(result.finalEquity.p95, 0)} tone="positive" />
        <StatTile label="Median max DD" value={fmtPercent(result.maxDrawdown.median)} />
        <StatTile label="Worst max DD" value={fmtPercent(result.maxDrawdown.worst)} tone="negative" />
        <StatTile label="Risk of ruin" value={fmtPercent(result.ruinProbability)} tone={ruinTone} note={`< ${ruinPct}% equity`} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        A what-if under a fixed win rate and per-trade returns you typed in -
        it never reads real data, so treat it as an intuition pump. The
        trade-sequence card above resamples real trades; prefer it for
        decisions. Not investment advice.
      </p>
    </ToolCard>
  );
}

/** A small SVG fan of sample equity paths. */
function EquityFan({
  paths,
  startEquity,
}: {
  paths: number[][];
  startEquity: number;
}) {
  const width = 720;
  const height = 220;

  const { polylines, zeroY } = React.useMemo(() => {
    if (paths.length === 0) return { polylines: [], zeroY: height / 2 };
    let min = Infinity;
    let max = -Infinity;
    for (const path of paths) {
      for (const v of path) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const steps = paths[0]!.length - 1;
    const x = (i: number) => (steps === 0 ? 0 : (i / steps) * width);
    const y = (v: number) => height - ((v - min) / (max - min)) * height;

    const polylines = paths.map((path) =>
      path.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" "),
    );
    return { polylines, zeroY: y(startEquity) };
  }, [paths, startEquity]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-48 w-full rounded-md border border-border bg-background"
      preserveAspectRatio="none"
      role="img"
      aria-label="Sample equity paths"
    >
      <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="4 4" className="text-muted-foreground" />
      {polylines.map((points, i) => (
        <polyline
          key={i}
          points={points}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeOpacity={0.35}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
