"use client";

import * as React from "react";
import { RotateCcw, Square, Upload, X } from "lucide-react";
import { tradeLogReturns, type SimulateInput } from "@typhed/risk-toolkit";

import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { useSimulation } from "@/lib/use-simulation";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  Segmented,
  StatTile,
  ToolCard,
} from "@/components/tools/controls";
import { Distribution } from "@/components/tools/distribution";
import { FanChart } from "@/components/tools/fan-chart";
import {
  TRADE_LIST_VERSION,
  type TradeListExport,
} from "@/components/tools/ema-lab-detail";

const PATH_TIERS = [
  { value: "1k", label: "1k", paths: 1000 },
  { value: "10k", label: "10k", paths: 10000 },
  { value: "50k", label: "50k", paths: 50000 },
] as const;

type PathTier = (typeof PATH_TIERS)[number]["value"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseRText(text: string): number[] {
  return text
    .split(/[\s,;]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/**
 * Trade-sequence Monte Carlo (MC4): bootstrap a real R-multiple list - the
 * EMA Swing Lab's export, or one entered by hand - instead of a fixed
 * win/loss Bernoulli. Each simulated step is one resampled trade at a fixed
 * risk fraction; the engine, worker, seeds, and metrics are the same ones
 * behind the Monte Carlo Lab.
 */
export function TradeSequenceMonteCarlo() {
  const [rText, setRText] = React.useState("");
  const [imported, setImported] = React.useState<{
    label: string;
    rMultiples: number[];
  } | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [tradesPerPath, setTradesPerPath] = React.useState(100);
  const [tier, setTier] = React.useState<PathTier>("10k");
  const [riskPct, setRiskPct] = React.useState(1);
  const [startEquity, setStartEquity] = React.useState(100000);
  const [seed, setSeed] = React.useState(1);
  const [ruinPct, setRuinPct] = React.useState(50);
  const [targetGainPct, setTargetGainPct] = React.useState(20);
  const importRef = React.useRef<HTMLInputElement>(null);

  const { status, progress, summary, error, run, cancel } = useSimulation();

  const rMultiples = React.useMemo(
    () => imported?.rMultiples ?? parseRText(rText),
    [imported, rText],
  );

  const input = React.useMemo<SimulateInput | null>(() => {
    if (rMultiples.length < 10) return null;
    return {
      logReturns: tradeLogReturns(
        rMultiples,
        clamp(riskPct, 0.1, 10) / 100,
      ),
      mode: "iid",
      horizon: clamp(Math.round(tradesPerPath) || 1, 1, 2000),
      paths: PATH_TIERS.find((t) => t.value === tier)!.paths,
      seed: Math.round(seed),
      startValue: Math.max(1, startEquity),
      ruinFraction: clamp(ruinPct, 1, 99) / 100,
      targetMultiple: 1 + Math.max(0, targetGainPct) / 100,
      samplePaths: 12,
      collectTerminals: true,
    };
  }, [rMultiples, riskPct, tradesPerPath, tier, seed, startEquity, ruinPct, targetGainPct]);

  React.useEffect(() => {
    if (!input) return;
    const timer = setTimeout(() => run(input), 400);
    return () => clearTimeout(timer);
  }, [input, run]);

  async function handleImportFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<TradeListExport>;
      if (
        parsed.version !== TRADE_LIST_VERSION ||
        !Array.isArray(parsed.rMultiples) ||
        !parsed.rMultiples.every((r) => typeof r === "number")
      ) {
        setImportError(
          "Not a trade-list export - use the EMA Swing Lab's Export button.",
        );
        return;
      }
      setImported({
        label: `${file.name} (${parsed.rMultiples.length} trades${parsed.emaPeriod ? `, EMA ${parsed.emaPeriod}` : ""})`,
        rMultiples: parsed.rMultiples,
      });
      setImportError(null);
    } catch {
      setImportError("Could not read that file - is it valid JSON?");
    }
  }

  return (
    <ToolCard
      title="Trade-sequence Monte Carlo"
      description="Resample a real trade R-multiple list - the EMA Swing Lab's export, or your own - and see the equity odds it implies."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Import trade list
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = "";
          }}
        />
        {imported && (
          <span className="flex items-center gap-1 rounded-md bg-brand/15 px-2 py-1 text-xs text-brand">
            {imported.label}
            <button
              type="button"
              aria-label="Clear imported trade list"
              onClick={() => setImported(null)}
              className="rounded p-0.5 hover:bg-brand/10"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        <Segmented
          options={PATH_TIERS.map(({ value, label }) => ({ value, label }))}
          value={tier}
          onChange={setTier}
        />
      </div>

      {importError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {importError}
        </p>
      )}

      {!imported && (
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium">
            R-multiples (space or comma separated)
          </span>
          <textarea
            value={rText}
            onChange={(e) => setRText(e.target.value)}
            rows={2}
            placeholder="2.1 -1 -1 0.4 3.2 -0.5 -1 1.1 -1 0.9 ..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <NumberField
          label="Trades / path"
          value={tradesPerPath}
          onChange={setTradesPerPath}
          min={1}
          max={2000}
        />
        <NumberField
          label="Risk per trade"
          value={riskPct}
          onChange={setRiskPct}
          min={0.1}
          max={10}
          suffix="%"
        />
        <NumberField
          label="Start equity"
          value={startEquity}
          onChange={setStartEquity}
          min={1}
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
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
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

      {!input && (
        <p className="mt-4 text-sm text-muted-foreground">
          Provide at least 10 R-multiples - import the EMA Swing Lab&apos;s
          export or paste a list above.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {input && summary && (
        <>
          <div className="mt-6">
            <FanChart
              summary={summary}
              anchorLabel="one step per trade - anchored at"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile
              label="Median final"
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
            />
            <StatTile
              label={`P(+${fmtNumber(targetGainPct, 0)}%)`}
              value={
                summary.terminal.probTarget === null
                  ? "-"
                  : fmtPercent(summary.terminal.probTarget)
              }
            />
            <StatTile
              label="Risk of ruin"
              value={fmtPercent(summary.ruinProbability)}
              tone={summary.ruinProbability > 0.1 ? "negative" : "positive"}
              note={`< ${fmtNumber(ruinPct, 0)}% equity`}
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
              title="Final equity distribution"
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
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Method: trades are resampled independently (IID) from your list at a
        fixed {fmtNumber(riskPct, 1)}% risk per trade, so any serial
        dependence between real trades is deliberately ignored - that is what
        makes this a robustness check rather than a replay. Costs are already
        inside the exported R-multiples. Seeded and reproducible; not
        investment advice.
      </p>
    </ToolCard>
  );
}
