"use client";

import * as React from "react";
import { Square } from "lucide-react";
import type { Candle } from "@typhed/chart-engine";
import type {
  StrategyTemplate,
  SweepParams,
  SweepResult,
  SweepRow,
} from "@typhed/backtest";

import { fmtNumber, fmtPercent } from "@/lib/format";
import { useSweep } from "@/lib/use-sweep";
import { Button } from "@typhed/ui/components/ui/button";
import {
  NumberField,
  Segmented,
  StatTile,
  ToolCard,
} from "@/components/tools/controls";
import { EmaLabDetail } from "@/components/tools/ema-lab-detail";
import { cn } from "@typhed/ui/lib/utils";

const TEMPLATE_OPTIONS: ReadonlyArray<{
  value: StrategyTemplate;
  label: string;
}> = [
  { value: "pullback", label: "EMA pullback" },
  { value: "cross", label: "EMA cross" },
  { value: "dualCross", label: "Dual-EMA cross" },
];

type SortKey =
  | "emaPeriod"
  | "trades"
  | "winRate"
  | "avgR"
  | "profitFactor"
  | "maxDrawdown"
  | "exposure"
  | "touchFidelity"
  | "score"
  | "outOfSampleScore";

const SORT_VALUE: Record<SortKey, (row: SweepRow) => number> = {
  emaPeriod: (row) => row.emaPeriod,
  trades: (row) => row.cell.stats.trades,
  winRate: (row) => row.cell.stats.winRate,
  avgR: (row) => row.cell.stats.avgR,
  profitFactor: (row) =>
    Number.isFinite(row.cell.stats.profitFactor)
      ? row.cell.stats.profitFactor
      : Number.MAX_VALUE,
  maxDrawdown: (row) => row.cell.stats.maxDrawdown,
  exposure: (row) => row.cell.stats.exposure,
  touchFidelity: (row) => row.cell.touchFidelity ?? -1,
  score: (row) => row.cell.score,
  outOfSampleScore: (row) => row.cell.outOfSampleScore,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The EMA Swing Lab (ES track): find the EMA a security actually respects,
 * empirically, and simulate a simple 2-20 day swing strategy around it. The
 * sweep runs on the shared worker; the three overfitting guards from the
 * research doc are always on and always visible - minimum sample, plateau
 * (not spike) selection, and a 70/30 walk-forward with a degradation
 * warning.
 */
export function EmaSwingLab({
  candles,
  onSendTrades,
}: {
  candles: readonly Candle[];
  /** In-session hand-off of the selected EMA's R-multiples to the MC tool. */
  onSendTrades?: (label: string, rMultiples: number[]) => void;
}) {
  const [template, setTemplate] = React.useState<StrategyTemplate>("pullback");
  const [minPeriod, setMinPeriod] = React.useState(5);
  const [maxPeriod, setMaxPeriod] = React.useState(50);
  const [holdingCap, setHoldingCap] = React.useState(10);
  const [sweepCaps, setSweepCaps] = React.useState(false);
  const [costBps, setCostBps] = React.useState(50);
  const [atrStop, setAtrStop] = React.useState(2);
  const [riskPct, setRiskPct] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("emaPeriod");
  const [sortDir, setSortDir] = React.useState<1 | -1>(1);
  const [selected, setSelected] = React.useState<SweepRow | null>(null);

  const { status, progress, sweep, error, run, cancel } = useSweep();

  // A new sweep invalidates the old selection's parameters.
  React.useEffect(() => setSelected(null), [sweep]);

  const params = React.useMemo<SweepParams>(() => {
    const lo = clamp(Math.round(minPeriod) || 5, 2, 200);
    const hi = clamp(Math.round(maxPeriod) || 50, lo, 200);
    const cap = clamp(Math.round(holdingCap) || 10, 2, 20);
    return {
      template,
      emaPeriods: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
      holdingCapBars: cap,
      ...(sweepCaps
        ? { holdingCaps: Array.from({ length: 19 }, (_, i) => i + 2) }
        : {}),
      roundTripCostBps: clamp(costBps, 1, 1000),
      atrStopMultiple: Math.max(0, atrStop),
      riskPercent: clamp(riskPct, 0.1, 10),
    };
  }, [template, minPeriod, maxPeriod, holdingCap, sweepCaps, costBps, atrStop, riskPct]);

  React.useEffect(() => {
    if (candles.length < 120) return;
    const timer = setTimeout(() => run(candles, params), 500);
    return () => clearTimeout(timer);
  }, [candles, params, run]);

  const sortedRows = React.useMemo(() => {
    if (!sweep) return [];
    const value = SORT_VALUE[sortKey];
    return [...sweep.rows].sort((a, b) => sortDir * (value(a) - value(b)));
  }, [sweep, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === "emaPeriod" ? 1 : -1);
    }
  }

  if (candles.length < 120) {
    return (
      <ToolCard title="EMA Swing Lab">
        <p className="text-sm text-muted-foreground">
          The sweep needs at least 120 bars - upload a longer series.
        </p>
      </ToolCard>
    );
  }

  return (
    <ToolCard
      title="EMA Swing Lab"
      description="Which EMA does this security actually respect? Sweep the grid, read the guarded score, and simulate a simple 2-20 bar swing around the winner."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          options={TEMPLATE_OPTIONS}
          value={template}
          onChange={setTemplate}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sweepCaps}
            onChange={(e) => setSweepCaps(e.target.checked)}
          />
          Sweep holding caps 2-20
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <NumberField label="EMA from" value={minPeriod} onChange={setMinPeriod} min={2} max={200} />
        <NumberField label="EMA to" value={maxPeriod} onChange={setMaxPeriod} min={2} max={200} />
        <NumberField
          label="Holding cap (bars)"
          value={holdingCap}
          onChange={setHoldingCap}
          min={2}
          max={20}
        />
        <NumberField
          label="Round-trip cost"
          value={costBps}
          onChange={setCostBps}
          min={1}
          suffix="bps"
        />
        <NumberField
          label="ATR stop (multiple)"
          value={atrStop}
          onChange={setAtrStop}
          min={0}
          suffix="x ATR"
        />
        <NumberField
          label="Risk per trade"
          value={riskPct}
          onChange={setRiskPct}
          min={0.1}
          max={10}
          suffix="%"
        />
      </div>

      {status === "running" && (
        <div className="mt-4 flex items-center gap-2">
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

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {sweep && <SweepSummary sweep={sweep} />}

      {sweep && <ScoreCurve sweep={sweep} />}

      {sweep && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <SortHeader label="EMA" k="emaPeriod" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-2 py-2">Cap</th>
                <SortHeader label="Trades" k="trades" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Win rate" k="winRate" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Avg R" k="avgR" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="PF" k="profitFactor" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Max DD" k="maxDrawdown" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Exposure" k="exposure" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Touch fid." k="touchFidelity" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Score" k="score" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="OOS" k="outOfSampleScore" active={sortKey} dir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const cell = row.cell;
                const isBest = sweep.best?.emaPeriod === row.emaPeriod;
                const isSelected = selected?.emaPeriod === row.emaPeriod;
                return (
                  <tr
                    key={row.emaPeriod}
                    onClick={() => setSelected(isSelected ? null : row)}
                    className={cn(
                      "cursor-pointer border-b border-border/40 transition-colors hover:bg-accent/50",
                      cell.lowSample && "text-muted-foreground/60",
                      isSelected && "bg-accent/60",
                    )}
                    title={
                      cell.lowSample
                        ? `Too few trades (< ${sweep.minTrades}) - not eligible for the badge`
                        : "Click to see this EMA on the price chart"
                    }
                  >
                    <td className="px-2 py-1.5 font-medium">
                      {row.emaPeriod}
                      {cell.slowEmaPeriod !== null && `/${cell.slowEmaPeriod}`}
                      {isBest && (
                        <span className="ml-1 rounded bg-brand/15 px-1 py-0.5 text-[10px] uppercase tracking-wider text-brand">
                          best
                        </span>
                      )}
                      {cell.lowSample && (
                        <span className="ml-1 text-[10px]">too few trades</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">{cell.holdingCapBars}</td>
                    <td className="px-2 py-1.5">{cell.stats.trades}</td>
                    <td className="px-2 py-1.5">{fmtPercent(cell.stats.winRate, 0)}</td>
                    <td className="px-2 py-1.5">{fmtNumber(cell.stats.avgR, 2)}</td>
                    <td className="px-2 py-1.5">
                      {Number.isFinite(cell.stats.profitFactor)
                        ? fmtNumber(cell.stats.profitFactor, 2)
                        : "∞"}
                    </td>
                    <td className="px-2 py-1.5">{fmtPercent(cell.stats.maxDrawdown, 0)}</td>
                    <td className="px-2 py-1.5">{fmtPercent(cell.stats.exposure, 0)}</td>
                    <td className="px-2 py-1.5">
                      {cell.touchFidelity === null
                        ? "-"
                        : fmtPercent(cell.touchFidelity, 0)}
                    </td>
                    <td className="px-2 py-1.5">{fmtNumber(cell.score, 2)}</td>
                    <td className="px-2 py-1.5">
                      {fmtNumber(cell.outOfSampleScore, 2)}
                      {cell.oosDegraded && (
                        <span
                          className="ml-1 text-amber-500"
                          title="Out-of-sample score collapsed below half of in-sample - treat this EMA as fragile."
                        >
                          ⚠
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <EmaLabDetail
          candles={candles}
          row={selected}
          sweepParams={params}
          onSendTrades={onSendTrades}
        />
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        A historical simulation with simplified fills and costs is a study of
        tendency, not a promise of future returns. Signals fill at the next
        bar&apos;s open, costs are always on, and the guards exist to show
        how fragile a &quot;best&quot; EMA is: grey rows have too few trades
        to trust, the badge goes to the best plateau (score smoothed over
        N&nbsp;&plusmn;&nbsp;2), and the OOS column is the last 30% of your
        data that the fit never saw. Touch fidelity is the share of EMA
        touches that resolved upward within the holding window - it measures
        &quot;follows this EMA&quot; independently of P&amp;L. Not investment
        advice.
      </p>
    </ToolCard>
  );
}

function SortHeader({
  label,
  k,
  active,
  dir,
  onSort,
}: {
  label: string;
  k: SortKey;
  active: SortKey;
  dir: 1 | -1;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th className="px-2 py-2">
      <button
        type="button"
        onClick={() => onSort(k)}
        className="flex items-center gap-1 rounded font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        {active === k && <span aria-hidden>{dir === 1 ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function SweepSummary({ sweep }: { sweep: SweepResult }) {
  const fitPct = Math.round(sweep.walkForwardSplit * 100);
  const best = sweep.best;
  if (!best) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No EMA cleared the {sweep.minTrades}-trade minimum on this series -
        every row is greyed. A longer history (or a shorter EMA range) is
        needed before any &quot;best EMA&quot; claim would be honest.
      </p>
    );
  }
  const cell = best.cell;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatTile
        label="Best EMA (plateau)"
        value={`${best.emaPeriod}${cell.slowEmaPeriod !== null ? `/${cell.slowEmaPeriod}` : ""}`}
        tone="brand"
        note={`cap ${cell.holdingCapBars} bars`}
      />
      <StatTile label="Closed trades" value={String(cell.stats.trades)} />
      <StatTile
        label="Avg R"
        value={fmtNumber(cell.stats.avgR, 2)}
        tone={cell.stats.avgR >= 0 ? "positive" : "negative"}
      />
      <StatTile
        label="Touch fidelity"
        value={
          cell.touchFidelity === null ? "-" : fmtPercent(cell.touchFidelity, 0)
        }
        note="touches resolving upward"
      />
      <StatTile
        label={`Out-of-sample (last ${100 - fitPct}%)`}
        value={fmtNumber(cell.outOfSampleScore, 2)}
        tone={cell.oosDegraded ? "negative" : "default"}
        note={
          cell.oosDegraded
            ? "collapsed vs in-sample - fragile"
            : `vs ${fmtNumber(cell.inSampleScore, 2)} on the first ${fitPct}%`
        }
      />
    </div>
  );
}

/** Score vs N - always displayed so a single spike can never hide. */
function ScoreCurve({ sweep }: { sweep: SweepResult }) {
  const width = 720;
  const height = 160;
  const rows = sweep.rows;

  const { rawLine, smoothLine, bestX } = React.useMemo(() => {
    const scores = rows.map((r) => r.cell.score);
    const smoothed = rows.map((r) => r.smoothedScore);
    let min = Math.min(...scores, ...smoothed, 0);
    let max = Math.max(...scores, ...smoothed, 0);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const x = (i: number) =>
      rows.length <= 1 ? 0 : (i / (rows.length - 1)) * width;
    const y = (v: number) => height - ((v - min) / (max - min)) * (height - 8) - 4;
    const line = (vs: number[]) =>
      vs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const bestIndex = sweep.best
      ? rows.findIndex((r) => r.emaPeriod === sweep.best!.emaPeriod)
      : -1;
    return {
      rawLine: line(scores),
      smoothLine: line(smoothed),
      bestX: bestIndex >= 0 ? x(bestIndex) : null,
    };
  }, [rows, sweep.best]);

  return (
    <div className="mt-6">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        Score vs EMA period (raw thin, plateau-smoothed thick)
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full rounded-md border border-border bg-background"
        preserveAspectRatio="none"
        role="img"
        aria-label="Score versus EMA period curve"
      >
        {bestX !== null && (
          <line
            x1={bestX}
            x2={bestX}
            y1={0}
            y2={height}
            stroke="hsl(var(--brand))"
            strokeOpacity={0.35}
            strokeDasharray="4 4"
          />
        )}
        <polyline
          points={rawLine}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className="text-muted-foreground"
        />
        <polyline
          points={smoothLine}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{rows[0]?.emaPeriod}</span>
        <span>{rows[rows.length - 1]?.emaPeriod}</span>
      </div>
    </div>
  );
}
