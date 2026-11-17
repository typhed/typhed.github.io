"use client"

import * as React from "react"
import { RotateCcw, Square } from "lucide-react"
import type { Candle } from "@typhed/chart-engine"
import {
  logReturns,
  type DataDrivenMode,
  type SimulateInput,
  type SimulationSummary,
} from "@typhed/risk-toolkit"

import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format"
import { useSimulation } from "@/lib/use-simulation"
import { Button } from "@typhed/ui/components/ui/button"
import { NumberField, Segmented, StatTile, ToolCard } from "@/components/tools/controls"
import { Distribution } from "@/components/tools/distribution"
import { FanChart } from "@/components/tools/fan-chart"

const MODE_OPTIONS: ReadonlyArray<{ value: DataDrivenMode; label: string }> = [
  { value: "iid", label: "IID bootstrap" },
  { value: "block", label: "Block bootstrap" },
  { value: "gbm", label: "GBM (normal)" },
  { value: "studentT", label: "Student-t" },
]

const PATH_TIERS = [
  { value: "1k", label: "1k", paths: 1000 },
  { value: "10k", label: "10k", paths: 10000 },
  { value: "50k", label: "50k", paths: 50000 },
  { value: "100k", label: "100k", paths: 100000 },
] as const

type PathTier = (typeof PATH_TIERS)[number]["value"]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The data-driven Monte Carlo tool (MC v2): simulates forward from the
 * uploaded series' own log returns in four modes, runs everything on the
 * shared worker with debounced inputs and cancellation, and anchors the
 * percentile fan at the last close. Every run is seeded - the "next seed"
 * button is the honest stability check.
 */
export function MonteCarloLab({ candles }: { candles: readonly Candle[] }) {
  const [mode, setMode] = React.useState<DataDrivenMode>("iid")
  const [horizon, setHorizon] = React.useState(252)
  const [tier, setTier] = React.useState<PathTier>("10k")
  const [seed, setSeed] = React.useState(1)
  const [antithetic, setAntithetic] = React.useState(false)
  const [blockOverride, setBlockOverride] = React.useState(0)
  const [ruinPct, setRuinPct] = React.useState(50)
  const [targetGainPct, setTargetGainPct] = React.useState(20)

  const { status, progress, summary, error, run, cancel } = useSimulation()

  const returns = React.useMemo(() => logReturns(candles.map((c) => c.close)), [candles])
  const lastClose = candles.length ? candles[candles.length - 1]!.close : 1

  const parametric = mode === "gbm" || mode === "studentT"

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
      ...(mode === "block" && blockOverride > 0 ? { blockLength: blockOverride } : {}),
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
  )

  // Debounced auto-run: keystrokes never freeze anything (the simulation is
  // in the worker), and rapid edits collapse into one run.
  React.useEffect(() => {
    if (returns.length < 2) return
    const timer = setTimeout(() => run(input), 400)
    return () => clearTimeout(timer)
  }, [input, run, returns.length])

  if (returns.length < 2) {
    return (
      <ToolCard title="Monte Carlo Lab">
        <p className="text-muted-foreground text-sm">
          Not enough bars to fit the simulation - upload a longer series.
        </p>
      </ToolCard>
    )
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
              className="bg-secondary h-1.5 w-40 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-brand h-full transition-[width]"
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
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}

      {summary && <LabResults summary={summary} targetGainPct={targetGainPct} />}

      <p className="text-muted-foreground mt-6 text-xs">
        Simulation, not prediction: these are the odds your own history implies under each
        model&apos;s assumptions, nothing more. IID and block bootstraps resample the uploaded
        returns (block preserves short-range dependence; the block length defaults to the
        Patton-Politis-White automatic estimate). GBM and Student-t fit the sample moments; the t
        degrees of freedom are moment-matched to the sample kurtosis and capped at 50. All runs
        execute in a background worker; the same seed with the same inputs always reproduces the
        same numbers. Not investment advice.
      </p>
    </ToolCard>
  )
}

function LabResults({
  summary,
  targetGainPct,
}: {
  summary: SimulationSummary
  targetGainPct: number
}) {
  const modeFacts: string[] = [
    `drift/bar ${fmtPercent(Math.expm1(summary.drift), 3)}`,
    `sigma/bar ${fmtPercent(summary.sigma, 3)}`,
  ]
  if (summary.blockLength !== null) {
    modeFacts.push(`block length ${fmtNumber(summary.blockLength, 1)}`)
  }
  if (summary.nu !== null) {
    modeFacts.push(`t degrees of freedom ${summary.nu}`)
  }
  if (summary.antithetic) modeFacts.push("antithetic on")

  return (
    <>
      <div className="mt-6">
        <FanChart summary={summary} anchorLabel="anchored at the last close" />
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {summary.paths.toLocaleString("en-IN")} paths, seed {summary.seed} - {modeFacts.join(", ")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Median terminal" value={fmtMoney(summary.terminal.p50, 0)} tone="brand" />
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
            summary.terminal.probTarget === null ? "-" : fmtPercent(summary.terminal.probTarget)
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
        <StatTile label="Median max DD" value={fmtPercent(summary.maxDrawdown.median)} />
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
  )
}
