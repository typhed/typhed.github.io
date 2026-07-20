"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { Candle } from "@typhed/chart-engine";
import {
  runBacktest,
  type BacktestParams,
  type BacktestResult,
  type SweepParams,
  type SweepRow,
} from "@typhed/backtest";

import { downloadJson } from "@/lib/download";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/tools/controls";
import { Distribution } from "@/components/tools/distribution";

/** Version stamp for the exported trade-list JSON the MC tool consumes. */
export const TRADE_LIST_VERSION = 1;

export interface TradeListExport {
  version: number;
  source: "ema-swing-lab";
  exportedAt: string;
  template: string;
  emaPeriod: number;
  slowEmaPeriod: number | null;
  holdingCapBars: number;
  roundTripCostBps: number;
  rMultiples: number[];
}

/**
 * Detail view for one selected sweep row: the backtest re-run for that EMA,
 * the price panel with the EMA overlay and entry/exit markers, equity and
 * underwater panels, the R-multiple distribution, and the one-click trade
 * list export that feeds the Monte Carlo trade-resampling mode.
 */
export function EmaLabDetail({
  candles,
  row,
  sweepParams,
  onSendTrades,
}: {
  candles: readonly Candle[];
  row: SweepRow;
  sweepParams: SweepParams;
  /** In-session hand-off to the trade-sequence Monte Carlo. */
  onSendTrades?: (label: string, rMultiples: number[]) => void;
}) {
  const params = React.useMemo<BacktestParams>(
    () => ({
      template: sweepParams.template,
      emaPeriod: row.emaPeriod,
      ...(row.cell.slowEmaPeriod !== null
        ? { slowEmaPeriod: row.cell.slowEmaPeriod }
        : {}),
      holdingCapBars: row.cell.holdingCapBars,
      roundTripCostBps: sweepParams.roundTripCostBps,
      ...(sweepParams.atrStopMultiple !== undefined
        ? { atrStopMultiple: sweepParams.atrStopMultiple }
        : {}),
      ...(sweepParams.riskPercent !== undefined
        ? { riskPercent: sweepParams.riskPercent }
        : {}),
    }),
    [row, sweepParams],
  );

  // One backtest for one N is O(bars) - fine on the main thread.
  const result = React.useMemo(
    () => runBacktest(candles, params),
    [candles, params],
  );

  function handleExport() {
    const payload: TradeListExport = {
      version: TRADE_LIST_VERSION,
      source: "ema-swing-lab",
      exportedAt: new Date().toISOString(),
      template: params.template,
      emaPeriod: params.emaPeriod,
      slowEmaPeriod: row.cell.slowEmaPeriod,
      holdingCapBars: params.holdingCapBars,
      roundTripCostBps: params.roundTripCostBps,
      rMultiples: result.trades.map((t) => t.rMultiple),
    };
    downloadJson(
      `typhed-ema-trades-${params.template}-N${params.emaPeriod}.json`,
      JSON.stringify(payload, null, 2),
    );
  }

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold">
          EMA {params.emaPeriod}
          {row.cell.slowEmaPeriod !== null && `/${row.cell.slowEmaPeriod}`} -{" "}
          {result.trades.length} trades, cap {params.holdingCapBars} bars
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {onSendTrades && (
            <Button
              variant="brand"
              size="sm"
              disabled={result.trades.length === 0}
              onClick={() =>
                onSendTrades(
                  `EMA ${params.emaPeriod} (${result.trades.length} trades)`,
                  result.trades.map((t) => t.rMultiple),
                )
              }
              title="Send this trade list straight to the trade-sequence Monte Carlo."
            >
              Send to Monte Carlo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={result.trades.length === 0}
            title="Export the trade R-multiples as JSON - the Monte Carlo trade-sequence mode consumes this file."
          >
            <Download className="h-4 w-4" />
            Export trade list
          </Button>
        </div>
      </div>

      <PricePanel candles={candles} result={result} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EquityPanel equity={result.equity} />
        {result.trades.length > 0 && (
          <Distribution
            title="R-multiple distribution"
            values={result.trades.map((t) => t.rMultiple)}
            format={(v) => `${fmtNumber(v, 1)}R`}
            bins={24}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="End equity"
          value={fmtMoney(result.stats.endEquity, 0)}
          tone={result.stats.totalReturn >= 0 ? "positive" : "negative"}
          note={fmtPercent(result.stats.totalReturn)}
        />
        <StatTile label="Win rate" value={fmtPercent(result.stats.winRate, 0)} />
        <StatTile
          label="Avg R"
          value={fmtNumber(result.stats.avgR, 2)}
          tone={result.stats.avgR >= 0 ? "positive" : "negative"}
        />
        <StatTile
          label="Max drawdown"
          value={fmtPercent(result.stats.maxDrawdown)}
          tone="negative"
        />
        <StatTile
          label="Exposure"
          value={fmtPercent(result.stats.exposure, 0)}
          note="bars in market"
        />
      </div>
    </div>
  );
}

/** Close line with the EMA overlay and entry/exit markers, hand-rolled SVG. */
function PricePanel({
  candles,
  result,
}: {
  candles: readonly Candle[];
  result: BacktestResult;
}) {
  const width = 720;
  const height = 240;

  const { closeLine, emaLine, slowLine, entries, exits } = React.useMemo(() => {
    const n = candles.length;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < n; i += 1) {
      const c = candles[i]!.close;
      if (c < min) min = c;
      if (c > max) max = c;
    }
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * width);
    const y = (v: number) => height - ((v - min) / (max - min)) * (height - 8) - 4;

    // Downsample long series for the polylines; markers stay exact.
    const stride = Math.max(1, Math.ceil(n / 1500));
    const sample = (values: readonly number[]) => {
      const points: string[] = [];
      for (let i = 0; i < n; i += stride) {
        points.push(`${x(i).toFixed(1)},${y(values[i]!).toFixed(1)}`);
      }
      const last = n - 1;
      if (last % stride !== 0) {
        points.push(`${x(last).toFixed(1)},${y(values[last]!).toFixed(1)}`);
      }
      return points.join(" ");
    };

    const closes = candles.map((c) => c.close);
    return {
      closeLine: sample(closes),
      emaLine: sample(result.ema),
      slowLine: result.slowEma ? sample(result.slowEma) : null,
      entries: result.trades.map((t) => ({
        x: x(t.entryIndex),
        y: y(t.entryPrice),
      })),
      exits: result.trades.map((t) => ({
        x: x(t.exitIndex),
        y: y(t.exitPrice),
      })),
    };
  }, [candles, result]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full rounded-md border border-border bg-background"
        preserveAspectRatio="none"
        role="img"
        aria-label="Price with the selected EMA overlay and entry/exit markers"
      >
        <polyline
          points={closeLine}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className="text-muted-foreground"
        />
        <polyline
          points={emaLine}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        {slowLine && (
          <polyline
            points={slowLine}
            fill="none"
            stroke="hsl(var(--brand-2))"
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {entries.map((p, i) => (
          <path
            key={`entry-${i}`}
            d={`M ${p.x} ${p.y + 4} l -4 7 l 8 0 z`}
            fill="currentColor"
            className="text-success"
          />
        ))}
        {exits.map((p, i) => (
          <path
            key={`exit-${i}`}
            d={`M ${p.x} ${p.y - 4} l -4 -7 l 8 0 z`}
            fill="currentColor"
            className="text-destructive"
          />
        ))}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">
        Close (grey), EMA (brand), entries ▲ / exits ▼ at effective fill
        prices.
      </p>
    </div>
  );
}

/** Equity curve over its underwater (drawdown) shadow. */
function EquityPanel({ equity }: { equity: readonly number[] }) {
  const width = 360;
  const height = 140;
  const ddHeight = 40;

  const { equityLine, underwaterArea, maxDdLabel } = React.useMemo(() => {
    const n = equity.length;
    let min = Infinity;
    let max = -Infinity;
    for (const v of equity) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * width);
    const y = (v: number) =>
      height - ddHeight - ((v - min) / (max - min)) * (height - ddHeight - 8) - 4;

    const stride = Math.max(1, Math.ceil(n / 1000));
    const points: string[] = [];
    let peak = equity[0] ?? 0;
    const drawdowns: number[] = new Array(n);
    let worst = 0;
    for (let i = 0; i < n; i += 1) {
      const v = equity[i]!;
      if (v > peak) peak = v;
      const dd = peak > 0 ? (peak - v) / peak : 0;
      drawdowns[i] = dd;
      if (dd > worst) worst = dd;
    }
    for (let i = 0; i < n; i += stride) {
      points.push(`${x(i).toFixed(1)},${y(equity[i]!).toFixed(1)}`);
    }

    const ddScale = worst > 0 ? worst : 1;
    const ddY = (dd: number) => height - ddHeight + (dd / ddScale) * (ddHeight - 2);
    const area: string[] = [`M 0 ${height - ddHeight}`];
    for (let i = 0; i < n; i += stride) {
      area.push(`L ${x(i).toFixed(1)} ${ddY(drawdowns[i]!).toFixed(1)}`);
    }
    area.push(`L ${width} ${height - ddHeight} Z`);

    return {
      equityLine: points.join(" "),
      underwaterArea: area.join(" "),
      maxDdLabel: fmtPercent(worst),
    };
  }, [equity]);

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        Equity and underwater (max DD {maxDdLabel})
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full rounded-md border border-border bg-background"
        preserveAspectRatio="none"
        role="img"
        aria-label="Equity curve with underwater drawdown panel"
      >
        <polyline
          points={equityLine}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          x2={width}
          y1={height - ddHeight}
          y2={height - ddHeight}
          stroke="currentColor"
          strokeOpacity={0.2}
          className="text-muted-foreground"
        />
        <path
          d={underwaterArea}
          fill="hsl(var(--destructive))"
          fillOpacity={0.3}
        />
      </svg>
    </div>
  );
}
